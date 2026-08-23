export type OAGrade = 'grade1' | 'grade2' | 'grade3';

export interface MedicalProfile {
  oaGrade: OAGrade;
  painScale: number; // 1 - 10 (VAS)
  hasKneeSurgery: boolean;
  targetKnee: 'left' | 'right' | 'both';
}

export interface PainBadgeConfig {
  text: string;
  className: string;
  severity: 'mild' | 'moderate' | 'severe';
}

export interface ClinicalSafetyLimits {
  oaGrade: OAGrade;
  maxSafeFlexionAngle: number; // in degrees, e.g. 75, 90, 100
  targetHoldDurationSeconds: number; // e.g. 3-5 seconds
  dailyRepetitionTarget: number; // e.g. 10 reps
  description: string;
}
