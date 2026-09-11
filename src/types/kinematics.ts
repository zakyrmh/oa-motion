import type { SafetyZone } from './clinical';
export type { SafetyZone };



export interface Point2D {
  x: number; // Normalized 0.0 - 1.0
  y: number; // Normalized 0.0 - 1.0
  visibility?: number;
  presence?: number;
}


export interface Point3D extends Point2D {
  z: number;
}

export interface SmoothedPoseFrame {
  imageLandmarks: Point2D[];
  worldLandmarks: Point3D[];
  timestamp: number;
}

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface KneeAngleData {
  rawAngle: number;
  smoothedAngle: number;
  confidence: number;
  timestamp: number;
}

export type ExercisePhase =
  | 'REST'        // Extended baseline (e.g. >160°)
  | 'FLEXION'     // Bending knee actively
  | 'HOLD'        // Holding target angle in safe zone
  | 'EXTENSION'   // Straightening knee back
  | 'OVER_FLEXION'// Exceeding safe RoM limit
  | 'INVALID';    // Posture or landmark lost

export interface ParallaxVerification {
  isPerpendicular: boolean;
  shoulderWidthRatio: number;
  hipWidthRatio: number;
  message: string;
}

export type MovementType = 'sit_to_stand' | 'squat';

export interface ReferenceMovementKeyPhases {
  flexionStart: number;
  peakFlexion: number;
  extensionComplete: number;
}

export interface ReferenceMovement {
  id: string;
  type: MovementType;
  name: string;
  description: string;
  samplingRateHz: number;
  totalDurationSeconds: number;
  angleTimeSeries: number[];
  keyPhaseIndices: ReferenceMovementKeyPhases;
}

export interface SimilarityResult {
  dtwDistance: number;
  similarityScorePercent: number; // 0 - 100%
  nccScore: number;               // -1.0 hingga 1.0 (Normalized Cross-Correlation)
  zone: SafetyZone;               // 'GREEN' | 'YELLOW' | 'RED'
}


