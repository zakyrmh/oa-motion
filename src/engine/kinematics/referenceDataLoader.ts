import type { MovementType, ReferenceMovement } from '@/types/kinematics';
import { GOLDEN_REFERENCE_MOVEMENTS } from '@/constants/goldenData';
import { getSavedReferenceMovement } from './referenceStorage';

/**
 * Memuat data gerakan referensi (golden data) berdasarkan tipe gerakan.
 * @param type Tipe gerakan: 'sit_to_stand' | 'squat'
 * @returns Objekt ReferenceMovement
 */
export function getReferenceMovement(type: MovementType): ReferenceMovement {
  const movement = getSavedReferenceMovement(type) ?? GOLDEN_REFERENCE_MOVEMENTS[type];
  if (!movement) {
    throw new Error(`Data referensi untuk tipe gerakan '${type}' tidak ditemukan.`);
  }
  return movement;
}

/**
 * Mendapatkan seluruh koleksi data gerakan referensi yang tersedia.
 * @returns Array dari ReferenceMovement
 */
export function getAllReferenceMovements(): ReferenceMovement[] {
  return Object.keys(GOLDEN_REFERENCE_MOVEMENTS).map((type) => {
    const movementType = type as MovementType;
    return getSavedReferenceMovement(movementType) ?? GOLDEN_REFERENCE_MOVEMENTS[movementType];
  });
}

/**
 * Resample / ternormalisasi deret waktu sudut (angleTimeSeries) ke panjang sampel target.
 * Menggunakan interpolasi linier.
 * 
 * @param series Array sudut waktu (number[])
 * @param targetLength Ukuran array target (misal 100 sampel)
 * @returns Array sudut yang telah di-resample
 */
export function normalizeTimeSeries(series: number[], targetLength: number): number[] {
  if (!series || series.length === 0) {
    return [];
  }
  if (series.length === targetLength) {
    return [...series];
  }
  if (targetLength <= 1) {
    return [series[0]];
  }

  const result: number[] = new Array(targetLength);
  const srcMaxIdx = series.length - 1;

  for (let i = 0; i < targetLength; i++) {
    const srcPos = (i * srcMaxIdx) / (targetLength - 1);
    const lowIdx = Math.floor(srcPos);
    const highIdx = Math.min(lowIdx + 1, srcMaxIdx);
    const fraction = srcPos - lowIdx;

    const interpolated = series[lowIdx] + (series[highIdx] - series[lowIdx]) * fraction;
    result[i] = Math.round(interpolated * 10) / 10;
  }

  return result;
}
