import type { UserProfile } from './clinical';

export interface RepetitionRecord {
  repIndex: number;
  maxFlexionAngle: number;
  holdDurationSeconds: number;
  durationMs?: number; // Total duration of rep cycle in milliseconds
  isSafeRoM: boolean;
  formScore: number; // 0 - 100
  movementType?: 'sit_to_stand' | 'squat';
  similarityScore?: number;
  fatigueFlag?: boolean;
  timestamp: number;
}

export interface RepetitionBaseline {
  avgDurationMs: number;
  avgPeakFlexionAngle: number;
  sampleCount: number;
  isEstablished: boolean;
}

export interface FatigueEvaluation {
  fatigueFlag: boolean;
  speedDecayPercent: number; // Persentase penurunan kecepatan (misal > 30%)
  romDecayDegrees: number;   // Selisih derajat kemerosotan peak RoM (misal > 10°)
  reason?: string;
}

export interface ExerciseSessionSummary {
  sessionId: string;
  date: string; // ISO date string
  userProfile: UserProfile;
  totalRepsCompleted: number;
  safeRepsCompleted: number;
  maxFlexionReached: number;
  avgHoldDuration: number;
  totalDurationSeconds: number;
  overallFormScore: number;
  averageSimilarityScore: number;
  repetitionHistory: RepetitionRecord[];
  painScaleAfter?: number;
  fatigueFlag?: boolean;
}

