import { useState, useRef, useCallback, useEffect } from 'react';
import type { MedicalProfile, SafetyZone } from '@/types/clinical';
import type { ExercisePhase, Point2D } from '@/types/kinematics';
import type { RepetitionRecord, ExerciseSessionSummary } from '@/types/session';
import { SAFE_ROM_LIMITS } from '@/constants/clinical';
import { AUDIO_PHRASES } from '@/constants/audioPhrases';
import { calculateKneeAngle } from '@/engine/kinematics/angleCalculator';
import { EMAFilter } from '@/engine/kinematics/emaFilter';
import { getZoneThresholds, determineSafetyZone, determineExercisePhase } from '@/engine/kinematics/rulesEngine';
import { useAudioCoach } from './useAudioCoach';

export interface UseExerciseTrackingOptions {
  profile: MedicalProfile;
}

export function useExerciseTracking({ profile }: UseExerciseTrackingOptions) {
  const audioCoach = useAudioCoach(false);
  const { speak, playSuccess, playWarning } = audioCoach;

  const limits = SAFE_ROM_LIMITS[profile.oaGrade];
  const targetReps = limits.dailyRepetitionTarget;
  const thresholds = getZoneThresholds(profile.oaGrade);

  // EMA Filter instance for smoothing knee angle
  const emaFilterRef = useRef<EMAFilter>(new EMAFilter(0.25));

  // Running tracking state
  const [currentAngle, setCurrentAngle] = useState<number>(0);
  const [currentZone, setCurrentZone] = useState<SafetyZone>('GREEN');
  const [exercisePhase, setExercisePhase] = useState<ExercisePhase>('REST');
  const [repsCompleted, setRepsCompleted] = useState<number>(0);
  const [redZoneWarnings, setRedZoneWarnings] = useState<number>(0);
  const [maxFlexionReached, setMaxFlexionReached] = useState<number>(0);
  const [coachMessage, setCoachMessage] = useState<string>(
    'Posisikan tubuh Anda di depan kamera dan bersiap untuk mulai.'
  );
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // FSM and repetition tracking refs (to avoid stale closures in frame loops)
  const previousAngleRef = useRef<number>(0);
  const stageRef = useRef<'UP' | 'DOWN' | 'HOLD'>('UP');
  const currentRepMaxAngleRef = useRef<number>(0);
  const currentRepHadRedRef = useRef<boolean>(false);
  const currentRepHoldFramesRef = useRef<number>(0);
  const repetitionRecordsRef = useRef<RepetitionRecord[]>([]);
  const lastWarningTimeRef = useRef<number>(0);
  const lastInstructionTimeRef = useRef<number>(0);
  const repsCompletedRef = useRef<number>(0);
  const redZoneWarningsRef = useRef<number>(0);
  const maxFlexionReachedRef = useRef<number>(0);

  // Session Duration Timer
  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(() => {
      setDurationSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isFinished]);

  // Initial greeting audio
  useEffect(() => {
    const timer = setTimeout(() => {
      speak(AUDIO_PHRASES.EXERCISE.START);
    }, 800);
    return () => clearTimeout(timer);
  }, [speak]);

  /**
   * Process a single video frame's landmarks
   */
  const processFrameLandmarks = useCallback(
    (landmarks: Point2D[]) => {
      if (isFinished || !landmarks || landmarks.length < 33) return;

      // Select tracked side based on medical profile
      const side = profile.targetKnee === 'right' ? 'right' : 'left';
      const hipIndex = side === 'right' ? 24 : 23;
      const kneeIndex = side === 'right' ? 26 : 25;
      const ankleIndex = side === 'right' ? 28 : 27;

      const hip = landmarks[hipIndex];
      const knee = landmarks[kneeIndex];
      const ankle = landmarks[ankleIndex];

      if (!hip || !knee || !ankle) return;

      // Compute raw knee flexion angle (180 - theta)
      const rawAngle = calculateKneeAngle(hip, knee, ankle, side);

      // Smooth with EMA filter
      const smoothedAngle = emaFilterRef.current.filter(rawAngle);

      // Determine active zone and exercise phase
      const zone = determineSafetyZone(smoothedAngle, profile.oaGrade);
      const phase = determineExercisePhase(
        smoothedAngle,
        previousAngleRef.current,
        profile.oaGrade
      );

      previousAngleRef.current = smoothedAngle;
      setCurrentAngle(smoothedAngle);
      setCurrentZone(zone);
      setExercisePhase(phase);

      if (smoothedAngle > maxFlexionReachedRef.current) {
        maxFlexionReachedRef.current = smoothedAngle;
        setMaxFlexionReached(smoothedAngle);
      }

      const now = performance.now();

      // RED ZONE WARNING HANDLING
      if (zone === 'RED') {
        if (!currentRepHadRedRef.current) {
          currentRepHadRedRef.current = true;
          redZoneWarningsRef.current += 1;
          setRedZoneWarnings(redZoneWarningsRef.current);
        }

        // Throttle audio warning every 2.5 seconds to prevent audio spam
        if (now - lastWarningTimeRef.current > 2500) {
          playWarning();
          speak(AUDIO_PHRASES.EXERCISE.WARNING_OVER_FLEXION);
          lastWarningTimeRef.current = now;
        }
        setCoachMessage('⚠️ PERINGATAN: Tekukan lutut melebihi batas aman!');
      }

      // NICHOLAS RENOTTE REPETITION FSM
      // 1. Stand / Rest position: Angle < 25°
      if (smoothedAngle < 25.0) {
        if (stageRef.current === 'DOWN' || stageRef.current === 'HOLD') {
          // User just completed a squat repetition!
          const maxRepAngle = currentRepMaxAngleRef.current;

          // Only count if user performed an actual descent (at least 35° flexion)
          if (maxRepAngle >= 35.0) {
            const nextRepIndex = repsCompletedRef.current + 1;
            const hadRed = currentRepHadRedRef.current;
            const isSafe = !hadRed && maxRepAngle <= thresholds.yellowMax;
            const holdSeconds = Math.round((currentRepHoldFramesRef.current / 30) * 10) / 10;
            const formScore = isSafe ? (maxRepAngle >= thresholds.greenMax ? 100 : 90) : 60;

            const newRecord: RepetitionRecord = {
              repIndex: nextRepIndex,
              maxFlexionAngle: maxRepAngle,
              holdDurationSeconds: holdSeconds,
              isSafeRoM: isSafe,
              formScore,
              timestamp: Date.now(),
            };

            repetitionRecordsRef.current.push(newRecord);
            repsCompletedRef.current = nextRepIndex;
            setRepsCompleted(nextRepIndex);

            // Play audio feedback
            playSuccess();
            speak(AUDIO_PHRASES.EXERCISE.REP_SUCCESS(nextRepIndex, targetReps));

            if (nextRepIndex >= targetReps) {
              setCoachMessage('🎉 TARGET SELESAI! Sesi latihan hari ini tuntas.');
              setTimeout(() => {
                speak(AUDIO_PHRASES.EXERCISE.SESSION_COMPLETE);
              }, 1200);
            } else {
              setCoachMessage(`Bagus! Repetisi ke-${nextRepIndex} selesai. Siap untuk berikutnya.`);
            }
          }

          // Reset rep trackers
          stageRef.current = 'UP';
          currentRepMaxAngleRef.current = 0;
          currentRepHadRedRef.current = false;
          currentRepHoldFramesRef.current = 0;
        } else {
          stageRef.current = 'UP';
          if (now - lastInstructionTimeRef.current > 4000) {
            setCoachMessage('Kaki lurus. Tekuk lutut perlahan ke bawah.');
            lastInstructionTimeRef.current = now;
          }
        }
      }

      // 2. Descending / Squatting down: Angle >= 30°
      else if (smoothedAngle >= 30.0) {
        stageRef.current = 'DOWN';
        if (smoothedAngle > currentRepMaxAngleRef.current) {
          currentRepMaxAngleRef.current = smoothedAngle;
        }

        // Inside optimal yellow zone (near target RoM)
        if (zone === 'YELLOW') {
          stageRef.current = 'HOLD';
          currentRepHoldFramesRef.current += 1;
          setCoachMessage(`Zona Target (${smoothedAngle}°)! Tahan sebentar lalu kembali tegak.`);
        } else if (zone === 'GREEN') {
          setCoachMessage(`Zona Aman (${smoothedAngle}°). Tekuk perlahan.`);
        }
      }
    },
    [isFinished, profile, targetReps, thresholds, speak, playSuccess, playWarning]
  );

  /**
   * Finalize and compile ExerciseSessionSummary
   */
  const finishSession = useCallback((): ExerciseSessionSummary => {
    setIsFinished(true);
    audioCoach.stopSpeaking();

    const totalReps = repsCompletedRef.current;
    const records = repetitionRecordsRef.current;
    const safeReps = records.filter((r) => r.isSafeRoM).length;
    const avgHold = records.length
      ? Math.round((records.reduce((acc, r) => acc + r.holdDurationSeconds, 0) / records.length) * 10) / 10
      : 0;
    const overallForm = records.length
      ? Math.round(records.reduce((acc, r) => acc + r.formScore, 0) / records.length)
      : 80;

    const summary: ExerciseSessionSummary = {
      sessionId: `session_${Date.now()}`,
      date: new Date().toISOString(),
      medicalProfile: profile,
      totalRepsCompleted: totalReps,
      safeRepsCompleted: safeReps,
      maxFlexionReached: Math.round(maxFlexionReachedRef.current * 10) / 10,
      avgHoldDuration: avgHold,
      totalDurationSeconds: durationSeconds,
      overallFormScore: overallForm,
      repetitionHistory: records,
    };

    return summary;
  }, [audioCoach, durationSeconds, profile]);

  return {
    currentAngle,
    currentZone,
    exercisePhase,
    repsCompleted,
    targetReps,
    redZoneWarnings,
    maxFlexionReached,
    coachMessage,
    durationSeconds,
    processFrameLandmarks,
    finishSession,
    audioCoach,
  };
}
