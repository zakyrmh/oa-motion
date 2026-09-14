import type { Point2D, Point3D } from '@/types/kinematics';
import { updateLegMeasurements, estimateKneePosition } from './occlusionHeuristics';

/**
 * Calculates the interior angle (in degrees) formed by three 2D points (P1 - P2 - P3)
 * where P2 is the vertex (e.g. Knee vertex between Hip and Ankle).
 *
 * Uses vector dot product: cos(theta) = (v1 . v2) / (|v1| * |v2|)
 */
export function calculateJointAngle2D(p1: Point2D, p2: Point2D, p3: Point2D): number {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

  const dotProduct = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

  if (mag1 === 0 || mag2 === 0) return 180;

  let cosTheta = dotProduct / (mag1 * mag2);
  // Clamp value to handle floating point errors
  cosTheta = Math.max(-1.0, Math.min(1.0, cosTheta));

  const angleRad = Math.acos(cosTheta);
  const angleDeg = (angleRad * 180) / Math.PI;

  return Math.round(angleDeg * 10) / 10;
}

/**
 * Calculates the interior angle (in degrees) for 3D coordinates.
 */
export function calculateJointAngle3D(p1: Point3D, p2: Point3D, p3: Point3D): number {
  const z1 = p1.z ?? 0;
  const z2 = p2.z ?? 0;
  const z3 = p3.z ?? 0;

  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y, z: z1 - z2 };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y, z: z3 - z2 };

  const dotProduct = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);

  if (mag1 === 0 || mag2 === 0) return 180;

  let cosTheta = dotProduct / (mag1 * mag2);
  cosTheta = Math.max(-1.0, Math.min(1.0, cosTheta));

  const angleRad = Math.acos(cosTheta);
  const angleDeg = (angleRad * 180) / Math.PI;

  return Math.round(angleDeg * 10) / 10;
}

/**
 * Convenience helper specifically for Knee Flexion Angle (Hip - Knee - Ankle).
 * Calculates the flexion angle: 180 - theta, representing how much the knee is bent from straight (0°).
 * Validates that all joints have a visibility score of at least 0.60, or estimates the knee position
 * in case of clothing occlusion using previously calibrated leg segment lengths.
 */
export function calculateKneeAngle(
  hip: Point3D,
  knee: Point3D,
  ankle: Point3D,
  side: 'left' | 'right' = 'left'
): number {
  // Validasi visibilitas dasar untuk Hip dan Ankle
  if (
    (hip.visibility !== undefined && hip.visibility < 0.60) ||
    (ankle.visibility !== undefined && ankle.visibility < 0.60)
  ) {
    return 0.0;
  }

  let activeKnee = knee;

  // Penanganan Oklusi: Jika visibilitas lutut rendah, coba estimasikan posisinya
  if (knee.visibility !== undefined && knee.visibility < 0.60) {
    const estimated = estimateKneePosition(hip, ankle, side);
    if (!estimated) {
      return 0.0; // Gagal estimasi karena tidak ada data historis valid sebelumnya
    }
    activeKnee = estimated;
  } else {
    // Jika semua sendi valid, perbarui data kalibrasi panjang kaki untuk oklusi di masa depan
    updateLegMeasurements(hip, knee, ankle, side);
  }

  const hasDepthCoordinates = [hip, activeKnee, ankle].every(
    (point) => point.z !== undefined && Number.isFinite(point.z)
  );
  const interiorAngle = hasDepthCoordinates
    ? calculateJointAngle3D(hip, activeKnee, ankle)
    : calculateJointAngle2D(hip, activeKnee, ankle);
  
  // Normalisasi sudut fleksi: Flexion Angle = 180 - interiorAngle
  const flexionAngle = 180 - interiorAngle;

  // Pastikan output dalam rentang 0 sampai 180
  const normalized = Math.max(0.0, Math.min(180.0, flexionAngle));

  // Bulatkan ke satu desimal
  return Math.round(normalized * 10) / 10;
}
