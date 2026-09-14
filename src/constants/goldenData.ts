import type { ReferenceMovement, MovementType } from '@/types/kinematics';

/**
 * Generate a smooth sinusoidal interpolation curve for realistic knee angle trajectory.
 * @param startAngle Angle at start (in degrees)
 * @param peakAngle Angle at peak flexion/extension (in degrees)
 * @param endAngle Angle at end (in degrees)
 * @param steps Total number of sample points
 */
function generateSmoothAngleSeries(
  startAngle: number,
  peakAngle: number,
  endAngle: number,
  steps: number
): number[] {
  const series: number[] = [];
  const halfSteps = Math.floor(steps / 2);
  const secondHalfSteps = steps - halfSteps;

  // Phase 1: startAngle -> peakAngle
  for (let i = 0; i < halfSteps; i++) {
    const t = i / (halfSteps - 1);
    // Smoothstep interpolation
    const easeT = t * t * (3 - 2 * t);
    const angle = startAngle + (peakAngle - startAngle) * easeT;
    series.push(Math.round(angle * 10) / 10);
  }

  // Phase 2: peakAngle -> endAngle
  for (let i = 1; i < secondHalfSteps; i++) {
    const t = i / (secondHalfSteps - 1);
    const easeT = t * t * (3 - 2 * t);
    const angle = peakAngle + (endAngle - peakAngle) * easeT;
    series.push(Math.round(angle * 10) / 10);
  }

  return series;
}

/**
 * Golden Data Referensi 1: Sit-to-Stand (Duduk ke Berdiri)
 * - Posisi awal: Sit (fleksi ~90°)
 * - Puncak ekstensi: Stand (fleksi ~5°, mendekati lurus)
 * - Kembali ke: Sit (fleksi ~90°)
 * Durasi: 4 detik (120 sampel pada 30 FPS)
 *
 * PENTING: skala di sini adalah SKALA FLEKSI (0° = lurus sempurna, membesar
 * seiring menekuk) — sama seperti calculateKneeAngle (2D) / calculateKneeFlexionAngle3D
 * dan data hasil rekam ReferenceRecorder. Sebelumnya nilai di sini terbalik
 * (90 -> 175 -> 90, skala interior lama) sehingga saat fallback ke golden data
 * ini terpakai, perbandingan gerakan pengguna selalu salah arah total.
 */
export const GOLDEN_DATA_SIT_TO_STAND: ReferenceMovement = {
  id: 'ref_sit_to_stand_v1',
  type: 'sit_to_stand',
  name: 'Sit-to-Stand (Duduk ke Berdiri)',
  description:
    'Gerakan referensi fisioterapi standar dari posisi duduk tegak di kursi ke berdiri lurus sempurna dan kembali duduk.',
  samplingRateHz: 30,
  totalDurationSeconds: 4.0,
  angleTimeSeries: generateSmoothAngleSeries(90, 5, 90, 120),
  keyPhaseIndices: {
    flexionStart: 0,
    peakFlexion: 59,
    extensionComplete: 119,
  },
};

/**
 * Golden Data Referensi 2: Squat (Berdiri ke Fleksi Bertahap)
 * - Posisi awal: Stand (fleksi ~5°, mendekati lurus)
 * - Puncak fleksi: Squat Aman (fleksi ~90°)
 * - Kembali ke: Stand (fleksi ~5°)
 * Durasi: 4 detik (120 sampel pada 30 FPS)
 */
export const GOLDEN_DATA_SQUAT: ReferenceMovement = {
  id: 'ref_squat_v1',
  type: 'squat',
  name: 'Squat Bertahap Aman',
  description:
    'Gerakan referensi squat fisioterapi dari posisi berdiri tegak, fleksi lutut aman hingga 90 derajat, dan kembali ke posisi berdiri.',
  samplingRateHz: 30,
  totalDurationSeconds: 4.0,
  angleTimeSeries: generateSmoothAngleSeries(5, 90, 5, 120),
  keyPhaseIndices: {
    flexionStart: 0,
    peakFlexion: 59,
    extensionComplete: 119,
  },
};

export const GOLDEN_REFERENCE_MOVEMENTS: Record<MovementType, ReferenceMovement> = {
  sit_to_stand: GOLDEN_DATA_SIT_TO_STAND,
  squat: GOLDEN_DATA_SQUAT,
};