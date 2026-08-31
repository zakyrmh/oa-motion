import type { Point2D } from '@/types/kinematics';

interface LegLengths {
  thighLength: number; // Jarak Hip ke Knee
  shinLength: number;  // Jarak Knee ke Ankle
}

interface LegTrackingState {
  lengths: LegLengths | null;
  lastValidKnee: Point2D | null;
  lastValidHip: Point2D | null;
  lastValidAnkle: Point2D | null;
}

// Menyimpan state kalibrasi/valid terakhir untuk kaki kiri dan kanan secara terpisah
const legStates: { left: LegTrackingState; right: LegTrackingState } = {
  left: { lengths: null, lastValidKnee: null, lastValidHip: null, lastValidAnkle: null },
  right: { lengths: null, lastValidKnee: null, lastValidHip: null, lastValidAnkle: null },
};

/**
 * Menghitung jarak Euclidean 2D antara dua titik.
 */
function getDistance2D(p1: Point2D, p2: Point2D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Memperbarui panjang segmen kaki (paha dan betis) dan koordinat sendi terakhir saat visibilitas bagus (>= 0.60).
 */
export function updateLegMeasurements(
  hip: Point2D,
  knee: Point2D,
  ankle: Point2D,
  side: 'left' | 'right'
): void {
  const thighLength = getDistance2D(hip, knee);
  const shinLength = getDistance2D(knee, ankle);

  // Pastikan panjang bernilai valid/masuk akal
  if (thighLength > 0.01 && shinLength > 0.01) {
    legStates[side].lengths = { thighLength, shinLength };
    legStates[side].lastValidKnee = { ...knee };
    legStates[side].lastValidHip = { ...hip };
    legStates[side].lastValidAnkle = { ...ankle };
  }
}

/**
 * Mengestimasi posisi lutut secara geometris saat terjadi oklusi (visibilitas < 0.60).
 * Menggunakan panjang paha dan betis yang terekam dari kalibrasi/frame valid sebelumnya.
 */
export function estimateKneePosition(
  hip: Point2D,
  ankle: Point2D,
  side: 'left' | 'right'
): Point2D | null {
  const state = legStates[side];
  if (!state.lengths || !state.lastValidKnee) {
    return null; // Tidak ada data kalibrasi panjang segmen kaki, tidak bisa mengestimasi
  }

  const L1 = state.lengths.thighLength;
  const L2 = state.lengths.shinLength;
  const d = getDistance2D(hip, ankle);

  if (d === 0) {
    // Skenario ekstrem: hip dan ankle bertumpuk, kembalikan posisi valid terakhir
    return { ...state.lastValidKnee, visibility: 0.60 };
  }

  // Jika jarak hip-ankle melebihi atau sama dengan panjang total kaki, kaki lurus sempurna
  if (d >= L1 + L2) {
    const ratio = L1 / (L1 + L2);
    return {
      x: hip.x + ratio * (ankle.x - hip.x),
      y: hip.y + ratio * (ankle.y - hip.y),
      visibility: 0.60,
    };
  }

  // Rekonstruksi segitiga Hip-Knee-Ankle (HKA)
  // Let P be the projection of Knee on the line segment HA.
  // xp is the distance from Hip to P.
  const xp = (L1 * L1 + d * d - L2 * L2) / (2 * d);
  const xpRatio = xp / d;

  // Koordinat titik proyeksi P
  const px = hip.x + xpRatio * (ankle.x - hip.x);
  const py = hip.y + xpRatio * (ankle.y - hip.y);

  // Tinggi tegak lurus h dari P ke Knee
  const hSquare = L1 * L1 - xp * xp;
  const h = Math.sqrt(Math.max(0, hSquare));

  // Vektor arah ternormalisasi dari Hip ke Ankle
  const vx = (ankle.x - hip.x) / d;
  const vy = (ankle.y - hip.y) / d;

  // Dua arah tegak lurus (perpendicular vectors)
  // n1 = (-vy, vx)
  // n2 = (vy, -vx)
  const k1 = {
    x: px - h * vy,
    y: py + h * vx,
    visibility: 0.60,
  };

  const k2 = {
    x: px + h * vy,
    y: py - h * vx,
    visibility: 0.60,
  };

  // Pilih titik proyeksi yang terdekat dengan posisi valid lutut terakhir
  const dist1 = getDistance2D(k1, state.lastValidKnee);
  const dist2 = getDistance2D(k2, state.lastValidKnee);

  return dist1 < dist2 ? k1 : k2;
}

/**
 * Mereset seluruh cache pelacakan (misalnya saat memuat ulang halaman latihan).
 */
export function resetLegTrackingStates(): void {
  legStates.left = { lengths: null, lastValidKnee: null, lastValidHip: null, lastValidAnkle: null };
  legStates.right = { lengths: null, lastValidKnee: null, lastValidHip: null, lastValidAnkle: null };
}
