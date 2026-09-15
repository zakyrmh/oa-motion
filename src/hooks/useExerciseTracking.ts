import { useState, useRef, useCallback, useEffect } from 'react';
import type { UserProfile, SafetyZone, OAGrade } from '@/types/clinical';
import type { ExercisePhase, Point3D, MovementType } from '@/types/kinematics';
import type { RepetitionRecord, ExerciseSessionSummary } from '@/types/session';
import { AUDIO_PHRASES } from '@/constants/audioPhrases';
import { calculateKneeFlexionAngle3D } from '@/engine/kinematics/angleCalculator';
import { EMAFilter } from '@/engine/kinematics/emaFilter';
import { calculateMovementSimilarity } from '@/engine/kinematics/dtwCalculator';
import { getReferenceMovement } from '@/engine/kinematics/referenceDataLoader';
import { AdaptiveFatigueTracker } from '@/engine/kinematics/fatigueDetector';
import { determineSafetyZone, determineExercisePhase } from '@/engine/kinematics/rulesEngine';
import { useAudioCoach } from './useAudioCoach';

export interface UseExerciseTrackingOptions {
  profile: UserProfile;
}

function getMovementForRep(capability: UserProfile['kapabilitas']): MovementType {
  if (capability === 'hanya_duduk') return 'sit_to_stand';
  return 'squat';
}

export function useExerciseTracking({ profile }: UseExerciseTrackingOptions) {
  const audioCoach = useAudioCoach(false);
  const { speak, playSuccess, playWarning } = audioCoach;
  const targetReps = Math.max(2, Math.min(20, profile.targetRepetisiPerSesi));
  const oaGrade: OAGrade = (profile as { oaGrade?: OAGrade }).oaGrade ?? 'grade2';
  const fatigueTrackerRef = useRef(new AdaptiveFatigueTracker());
  const [currentAngle, setCurrentAngle] = useState(0);
  const [currentZone, setCurrentZone] = useState<SafetyZone>('GREEN');
  const [currentSimilarityScore, setCurrentSimilarityScore] = useState(100);
  const [exercisePhase, setExercisePhase] = useState<ExercisePhase>('REST');
  const [activeMovement, setActiveMovement] = useState<MovementType>('squat');
  const [repsCompleted, setRepsCompleted] = useState(0);
  const [redZoneWarnings, setRedZoneWarnings] = useState(0);
  const [maxFlexionReached, setMaxFlexionReached] = useState(0);
  const [coachMessage, setCoachMessage] = useState('Posisikan tubuh Anda di depan kamera dan bersiap untuk mulai.');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [fatigueFlag, setFatigueFlag] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const emaFilterRef = useRef(new EMAFilter(0.25));
  const previousAngleRef = useRef(0);
  const stageRef = useRef<'UP' | 'DOWN' | 'HOLD'>('UP');
  const currentRepDeepestAngleRef = useRef(0);
  const currentRepHadRedRef = useRef(false);
  const currentRepHoldFramesRef = useRef(0);
  const currentRepStartedAtRef = useRef<number | null>(null);
  const currentSeriesRef = useRef<number[]>([]);
  const cycleStartedRef = useRef(false);
  const reachedStandingRef = useRef(false);
  const repetitionRecordsRef = useRef<RepetitionRecord[]>([]);
  const lastWarningTimeRef = useRef(0);
  const repsCompletedRef = useRef(0);
  const redZoneWarningsRef = useRef(0);
  const maxFlexionReachedRef = useRef(0);

  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(() => setDurationSeconds((previous) => previous + 1), 1000);
    return () => clearInterval(interval);
  }, [isFinished]);

  useEffect(() => {
    const timer = setTimeout(() => speak(AUDIO_PHRASES.EXERCISE.START), 800);
    return () => clearTimeout(timer);
  }, [speak]);

  const processFrameLandmarks = useCallback((landmarks: Point3D[]) => {
    if (isFinished || landmarks.length < 33) return;
    const side = profile.targetKnee === 'right' ? 'right' : 'left';
    const hipIndex = side === 'right' ? 24 : 23;
    const kneeIndex = side === 'right' ? 26 : 25;
    const ankleIndex = side === 'right' ? 28 : 27;
    const hip = landmarks[hipIndex];
    const knee = landmarks[kneeIndex];
    const ankle = landmarks[ankleIndex];
    if (!hip || !knee || !ankle) return;

    const smoothedAngle = emaFilterRef.current.filter(calculateKneeFlexionAngle3D(hip, knee, ankle));
    const previousAngle = previousAngleRef.current;
    previousAngleRef.current = smoothedAngle;
    setCurrentAngle(smoothedAngle);

    // Evaluasi zona keselamatan klinis real-time
    const clinicalZone = determineSafetyZone(smoothedAngle, oaGrade);
    setCurrentZone(clinicalZone);

    const phase = determineExercisePhase(smoothedAngle, previousAngle, oaGrade);
    setExercisePhase(phase);

    if (smoothedAngle > maxFlexionReachedRef.current) {
      maxFlexionReachedRef.current = smoothedAngle;
      setMaxFlexionReached(smoothedAngle);
    }

    const now = performance.now();
    const movement = getMovementForRep(profile.kapabilitas);
    setActiveMovement(movement);
    const reference = getReferenceMovement(movement);
    const isSitToStand = movement === 'sit_to_stand';

    // Peringatan zona merah klinis real-time saat fleksi melebihi batas aman
    if (clinicalZone === 'RED') {
      currentRepHadRedRef.current = true;
      if (now - lastWarningTimeRef.current > 2500) {
        redZoneWarningsRef.current += 1;
        setRedZoneWarnings(redZoneWarningsRef.current);
        playWarning();
        speak('Perhatian: Fleksi lutut melebihi batas aman. Kurangi kedalaman.');
        lastWarningTimeRef.current = now;
      }
      setCoachMessage('Lutut menekuk terlalu dalam! Kurangi kedalaman gerakan.');
    }

    // Finite State Machine (FSM) untuk deteksi siklus repetisi
    if (isSitToStand) {
      // SIT-TO-STAND: Mulai saat duduk (fleksi >= 70°), berdiri (fleksi <= 20°), lalu duduk kembali (fleksi >= 70°)
      const startsCycle = !cycleStartedRef.current && smoothedAngle >= 60;
      const completesCycle = cycleStartedRef.current && reachedStandingRef.current && smoothedAngle >= 60 && currentSeriesRef.current.length >= 8;

      if (startsCycle) {
        cycleStartedRef.current = true;
        reachedStandingRef.current = false;
        currentRepStartedAtRef.current = now;
        currentSeriesRef.current = [previousAngle, smoothedAngle];
        currentRepDeepestAngleRef.current = smoothedAngle;
        stageRef.current = 'UP';
        setCoachMessage('Mulai berdiri perlahan dan luruskan badan.');
      } else if (cycleStartedRef.current) {
        currentSeriesRef.current.push(smoothedAngle);
        if (smoothedAngle <= 20) {
          reachedStandingRef.current = true;
          setCoachMessage('Bagus! Sekarang duduk kembali dengan terkontrol.');
        }
      }

      if (completesCycle) {
        const nextRepIndex = repsCompletedRef.current + 1;
        const durationMs = currentRepStartedAtRef.current ? Math.round(now - currentRepStartedAtRef.current) : undefined;
        const similarity = calculateMovementSimilarity(currentSeriesRef.current, reference.angleTimeSeries);
        setCurrentSimilarityScore(similarity.similarityScorePercent);

        const record: RepetitionRecord = {
          repIndex: nextRepIndex,
          maxFlexionAngle: Math.round(currentRepDeepestAngleRef.current * 10) / 10,
          holdDurationSeconds: Math.round((currentRepHoldFramesRef.current / 30) * 10) / 10,
          durationMs,
          isSafeRoM: !currentRepHadRedRef.current && similarity.similarityScorePercent >= 50,
          formScore: similarity.similarityScorePercent,
          movementType: movement,
          similarityScore: similarity.similarityScorePercent,
          timestamp: Date.now(),
        };

        const fatigueEvaluation = fatigueTrackerRef.current.recordRepetition(record);
        record.fatigueFlag = fatigueEvaluation.fatigueFlag;
        if (fatigueEvaluation.fatigueFlag) {
          setFatigueFlag(true);
          setCoachMessage(fatigueEvaluation.reason ?? 'Indikasi kelelahan terdeteksi. Istirahat sebentar.');
        }

        repetitionRecordsRef.current.push(record);
        repsCompletedRef.current = nextRepIndex;
        setRepsCompleted(nextRepIndex);
        playSuccess();
        speak(AUDIO_PHRASES.EXERCISE.REP_SUCCESS(nextRepIndex, targetReps));

        if (nextRepIndex >= targetReps) setCoachMessage('Target selesai. Sesi latihan hari ini tuntas.');
        else setCoachMessage(`Bagus! Repetisi ke-${nextRepIndex} selesai. Skor: ${similarity.similarityScorePercent}%.`);

        // Reset siklus
        cycleStartedRef.current = false;
        reachedStandingRef.current = false;
        stageRef.current = 'UP';
        currentRepDeepestAngleRef.current = 0;
        currentRepHadRedRef.current = false;
        currentRepHoldFramesRef.current = 0;
        currentRepStartedAtRef.current = null;
        currentSeriesRef.current = [];
      }
    } else {
      // SQUAT: Mulai dari berdiri tegak (<= 20°), menekuk lutut (>= 25°), lalu kembali berdiri tegak (<= 20°)
      const startsCycle = !cycleStartedRef.current && smoothedAngle >= 25;
      const completesCycle = cycleStartedRef.current && currentRepDeepestAngleRef.current >= 30 && smoothedAngle <= 20 && currentSeriesRef.current.length >= 8;

      if (startsCycle) {
        cycleStartedRef.current = true;
        reachedStandingRef.current = false;
        currentRepStartedAtRef.current = now;
        currentSeriesRef.current = [previousAngle, smoothedAngle];
        currentRepDeepestAngleRef.current = smoothedAngle;
        stageRef.current = 'DOWN';
        setCoachMessage('Tekuk lutut perlahan sesuai batas kemampuan.');
      } else if (cycleStartedRef.current) {
        currentSeriesRef.current.push(smoothedAngle);
        currentRepDeepestAngleRef.current = Math.max(currentRepDeepestAngleRef.current, smoothedAngle);

        if (smoothedAngle >= 35 && Math.abs(smoothedAngle - previousAngle) < 1.0) {
          currentRepHoldFramesRef.current += 1;
        }

        if (smoothedAngle < previousAngle - 0.5) {
          stageRef.current = 'UP';
          if (clinicalZone !== 'RED') {
            setCoachMessage('Dorong tubuh naik kembali ke posisi berdiri tegak.');
          }
        }
      } else {
        // Posisi berdiri diam di luar siklus gerakan
        if (clinicalZone === 'GREEN' && repsCompletedRef.current > 0 && repsCompletedRef.current < targetReps) {
          setCoachMessage(`Bagus. Lanjutkan repetisi ke-${repsCompletedRef.current + 1}.`);
        }
      }

      if (completesCycle) {
        const nextRepIndex = repsCompletedRef.current + 1;
        const durationMs = currentRepStartedAtRef.current ? Math.round(now - currentRepStartedAtRef.current) : undefined;
        const similarity = calculateMovementSimilarity(currentSeriesRef.current, reference.angleTimeSeries);
        setCurrentSimilarityScore(similarity.similarityScorePercent);

        const record: RepetitionRecord = {
          repIndex: nextRepIndex,
          maxFlexionAngle: Math.round(currentRepDeepestAngleRef.current * 10) / 10,
          holdDurationSeconds: Math.round((currentRepHoldFramesRef.current / 30) * 10) / 10,
          durationMs,
          isSafeRoM: !currentRepHadRedRef.current && similarity.similarityScorePercent >= 50,
          formScore: similarity.similarityScorePercent,
          movementType: movement,
          similarityScore: similarity.similarityScorePercent,
          timestamp: Date.now(),
        };

        const fatigueEvaluation = fatigueTrackerRef.current.recordRepetition(record);
        record.fatigueFlag = fatigueEvaluation.fatigueFlag;
        if (fatigueEvaluation.fatigueFlag) {
          setFatigueFlag(true);
          setCoachMessage(fatigueEvaluation.reason ?? 'Indikasi kelelahan terdeteksi. Istirahat sebentar.');
        }

        repetitionRecordsRef.current.push(record);
        repsCompletedRef.current = nextRepIndex;
        setRepsCompleted(nextRepIndex);
        playSuccess();
        speak(AUDIO_PHRASES.EXERCISE.REP_SUCCESS(nextRepIndex, targetReps));

        if (nextRepIndex >= targetReps) setCoachMessage('Target selesai. Sesi latihan hari ini tuntas.');
        else setCoachMessage(`Bagus! Repetisi ke-${nextRepIndex} selesai. Skor: ${similarity.similarityScorePercent}%.`);

        // Reset siklus
        cycleStartedRef.current = false;
        reachedStandingRef.current = false;
        stageRef.current = 'UP';
        currentRepDeepestAngleRef.current = 0;
        currentRepHadRedRef.current = false;
        currentRepHoldFramesRef.current = 0;
        currentRepStartedAtRef.current = null;
        currentSeriesRef.current = [];
      }
    }
  }, [isFinished, oaGrade, playSuccess, playWarning, profile.kapabilitas, profile.targetKnee, speak, targetReps]);

  const finishSession = useCallback((): ExerciseSessionSummary => {
    setIsFinished(true);
    audioCoach.stopSpeaking();
    const records = repetitionRecordsRef.current;
    const averageSimilarityScore = records.length ? Math.round(records.reduce((sum, record) => sum + (record.similarityScore ?? 0), 0) / records.length) : 0;
    const overallFormScore = records.length ? Math.round(records.reduce((sum, record) => sum + record.formScore, 0) / records.length) : 0;
    return {
      sessionId: `session_${Date.now()}`,
      date: new Date().toISOString(),
      userProfile: profile,
      totalRepsCompleted: repsCompletedRef.current,
      safeRepsCompleted: records.filter((record) => record.isSafeRoM).length,
      maxFlexionReached: Math.round(maxFlexionReachedRef.current * 10) / 10,
      avgHoldDuration: records.length ? Math.round(records.reduce((sum, record) => sum + record.holdDurationSeconds, 0) / records.length * 10) / 10 : 0,
      totalDurationSeconds: durationSeconds,
      overallFormScore,
      averageSimilarityScore,
      repetitionHistory: records,
      fatigueFlag,
    };
  }, [audioCoach, durationSeconds, fatigueFlag, profile]);

  return { currentAngle, currentZone, currentSimilarityScore, exercisePhase, activeMovement, repsCompleted, targetReps, redZoneWarnings, maxFlexionReached, coachMessage, durationSeconds, fatigueFlag, processFrameLandmarks, finishSession, audioCoach };
}