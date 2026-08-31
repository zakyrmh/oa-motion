import type { OAGrade, SafetyZone, ZoneThresholds } from '@/types/clinical';
import type { ExercisePhase } from '@/types/kinematics';
import { SAFE_ROM_LIMITS } from '@/constants/clinical';

/**
 * Mendapatkan ambang batas sudut zona keselamatan berdasarkan Grade OA.
 * Zona Kuning selalu diatur sebesar 10 derajat di bawah batas aman maksimal.
 */
export function getZoneThresholds(oaGrade: OAGrade): ZoneThresholds {
  const limits = SAFE_ROM_LIMITS[oaGrade];
  const maxSafe = limits.maxSafeFlexionAngle;

  return {
    greenMax: maxSafe - 10,
    yellowMax: maxSafe,
    redMin: maxSafe,
  };
}

/**
 * Menentukan zona keselamatan aktif (GREEN, YELLOW, RED) berdasarkan sudut fleksi lutut saat ini.
 */
export function determineSafetyZone(angle: number, oaGrade: OAGrade): SafetyZone {
  const thresholds = getZoneThresholds(oaGrade);

  if (angle < thresholds.greenMax) {
    return 'GREEN';
  } else if (angle <= thresholds.yellowMax) {
    return 'YELLOW';
  } else {
    return 'RED';
  }
}

/**
 * Memetakan arah gerakan dan sudut lutut aktif ke dalam fase latihan (ExercisePhase).
 * @param currentAngle Sudut fleksi lutut aktif saat ini.
 * @param previousAngle Sudut fleksi lutut pada frame sebelumnya.
 * @param oaGrade Tingkat keparahan Osteoarthritis (Grade 1-3).
 */
export function determineExercisePhase(
  currentAngle: number,
  previousAngle: number,
  oaGrade: OAGrade
): ExercisePhase {
  const limits = SAFE_ROM_LIMITS[oaGrade];
  const maxSafe = limits.maxSafeFlexionAngle;

  // 1. Melebihi batas aman maksimal -> OVER_FLEXION
  if (currentAngle > maxSafe) {
    return 'OVER_FLEXION';
  }

  // 2. Kaki hampir lurus -> REST (fleksi < 15 derajat)
  if (currentAngle < 15.0) {
    return 'REST';
  }

  const delta = currentAngle - previousAngle;
  const tolerance = 0.5; // Batas toleransi noise mikro untuk mendeteksi posisi diam

  // 3. Sudut bertambah secara signifikan -> FLEXION (Menekuk)
  if (delta > tolerance) {
    return 'FLEXION';
  }

  // 4. Sudut berkurang secara signifikan -> EXTENSION (Meluruskan)
  if (delta < -tolerance) {
    return 'EXTENSION';
  }

  // 5. Posisi diam / ditahan (kecepatan gerak mendekati nol)
  // Jika ditahan di dalam Zona Kuning (optimal target hold), anggap fase HOLD
  if (currentAngle >= maxSafe - 10 && currentAngle <= maxSafe) {
    return 'HOLD';
  }

  // Jika diam di luar zona target, asumsikan fase mengikuti arah kecenderungan sebelumnya
  return delta >= 0 ? 'FLEXION' : 'EXTENSION';
}
