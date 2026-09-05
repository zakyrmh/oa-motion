export type OAGrade = 'grade1' | 'grade2' | 'grade3';
export type TargetKnee = 'left' | 'right' | 'both';

export interface MedicalProfile {
  oaGrade: OAGrade;
  painScale: number; // 1 - 10 (VAS)
  hasKneeSurgery: boolean;
  targetKnee: TargetKnee;
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

export type SafetyZone = 'GREEN' | 'YELLOW' | 'RED';

export interface ZoneThresholds {
  greenMax: number;   // Batas atas zona hijau (misal 80)
  yellowMax: number;  // Batas atas zona kuning (misal 90)
  redMin: number;     // Batas bawah zona merah (sama dengan yellowMax)
}
