import type { ReferenceMovement, MovementType } from '@/types/kinematics';

/**
 * Menghasilkan kurva sudut fleksi realistis dengan fase:
 * 1. Start baseline (berdiri/duduk)
 * 2. Transisi eksentrik (menekuk/berdiri)
 * 3. Tahanan isometrik (peak hold)
 * 4. Transisi konsentrik (kembali ke posisi awal)
 */
function generatePhysiologicalSeries(
  startAngle: number,
  peakAngle: number,
  endAngle: number,
  totalSteps: number = 120,
  holdSteps: number = 20
): number[] {
  const series: number[] = [];
  const movingSteps = Math.max(20, totalSteps - holdSteps);
  const halfMove = Math.floor(movingSteps / 2);
  const returnMove = movingSteps - halfMove;

  // Fase 1: Transisi Menuju Puncak (Smoothstep Ease-in-out)
  for (let i = 0; i < halfMove; i++) {
    const t = i / (halfMove - 1);
    const easeT = t * t * (3 - 2 * t);
    const angle = startAngle + (peakAngle - startAngle) * easeT;
    series.push(Math.round(angle * 10) / 10);
  }

  // Fase 2: Tahanan Puncak (Isometric Hold Plateau)
  for (let i = 0; i < holdSteps; i++) {
    // Sedikit variasi mikro fisiologis (+-0.2 derajat)
    const microVariation = Math.sin((i / holdSteps) * Math.PI) * 0.2;
    series.push(Math.round((peakAngle + microVariation) * 10) / 10);
  }

  // Fase 3: Transisi Kembali ke Posisi Awal
  for (let i = 1; i <= returnMove; i++) {
    const t = i / returnMove;
    const easeT = t * t * (3 - 2 * t);
    const angle = peakAngle + (endAngle - peakAngle) * easeT;
    series.push(Math.round(angle * 10) / 10);
  }

  return series;
}

/**
 * Golden Data Referensi 1: Sit-to-Stand (Duduk ke Berdiri)
 * - Posisi awal: Duduk di kursi (fleksi ~85°)
 * - Puncak ekstensi: Berdiri tegak lurus (fleksi ~5°)
 * - Kembali ke: Duduk terkontrol (fleksi ~85°)
 * Durasi: 4 detik (120 sampel pada 30 FPS)
 */
export const GOLDEN_DATA_SIT_TO_STAND: ReferenceMovement = {
  id: 'ref_sit_to_stand_v2',
  type: 'sit_to_stand',
  name: 'Sit-to-Stand Fisioterapi (Duduk ke Berdiri)',
  description:
    'Gerakan referensi fisioterapi standar dari posisi duduk tegak di kursi ke berdiri lurus sempurna dan kembali duduk terkontrol.',
  samplingRateHz: 30,
  totalDurationSeconds: 4.0,
  angleTimeSeries: generatePhysiologicalSeries(85, 5, 85, 120, 20),
  keyPhaseIndices: {
    flexionStart: 0,
    peakFlexion: 55,
    extensionComplete: 119,
  },
};

/**
 * Golden Data Referensi 2: Squat Bertahap Aman (Osteoarthritis Safe)
 * - Posisi awal: Berdiri tegak lurus (fleksi ~5°)
 * - Puncak fleksi: Squat Aman Rehabilitasi OA (fleksi ~70° - 75°)
 * - Tahanan isometrik: 20 frame (~0.7 detik)
 * - Kembali ke: Berdiri tegak lurus (fleksi ~5°)
 * Durasi: 4 detik (120 sampel pada 30 FPS)
 */
export const GOLDEN_DATA_SQUAT: ReferenceMovement = {
  id: 'ref_squat_v2',
  type: 'squat',
  name: 'Squat Bertahap Aman (Rehabilitasi OA)',
  description:
    'Gerakan referensi squat fisioterapi lutut terkontrol: berdiri tegak, fleksi bertahap hingga rentang aman 70°-75°, tahan sejenak, dan dorong naik kembali.',
  samplingRateHz: 30,
  totalDurationSeconds: 4.0,
  angleTimeSeries: generatePhysiologicalSeries(5, 72, 5, 120, 20),
  keyPhaseIndices: {
    flexionStart: 0,
    peakFlexion: 55,
    extensionComplete: 119,
  },
};

export const GOLDEN_REFERENCE_MOVEMENTS: Record<MovementType, ReferenceMovement> = {
  sit_to_stand: GOLDEN_DATA_SIT_TO_STAND,
  squat: GOLDEN_DATA_SQUAT,
};