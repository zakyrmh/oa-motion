import type { MedicalProfile } from './clinical';

export interface RepetitionRecord {
  repIndex: number;
  maxFlexionAngle: number;
  holdDurationSeconds: number;
  isSafeRoM: boolean;
  formScore: number; // 0 - 100
  timestamp: number;
}

export interface ExerciseSessionSummary {
  sessionId: string;
  date: string; // ISO date string
  medicalProfile: MedicalProfile;
  totalRepsCompleted: number;
  safeRepsCompleted: number;
  maxFlexionReached: number;
  avgHoldDuration: number;
  totalDurationSeconds: number;
  overallFormScore: number;
  repetitionHistory: RepetitionRecord[];
  painScaleAfter?: number;
}
