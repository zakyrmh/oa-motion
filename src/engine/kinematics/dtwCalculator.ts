import type { SimilarityResult, SafetyZone } from '@/types/kinematics';
import { normalizeTimeSeries } from './referenceDataLoader';

/**
 * Menghitung jarak Dynamic Time Warping (DTW) ter-normalisasi antara dua deret waktu sudut.
 * Menggunakan matriks alokasi 2D Euclidean cost $O(M \times N)$.
 * 
 * @param userSeries Deret waktu sudut aktif pengguna (dalam derajat)
 * @param referenceSeries Deret waktu sudut referensi (dalam derajat)
 * @returns Jarak rata-rata DTW per sampel (0 = identik, semakin besar semakin beda)
 */
export function calculateDTWDistance(userSeries: number[], referenceSeries: number[]): number {
  if (!userSeries || userSeries.length === 0 || !referenceSeries || referenceSeries.length === 0) {
    return Infinity;
  }

  const n = userSeries.length;
  const m = referenceSeries.length;

  // Inisialisasi matriks akumulasi DP dengan Infinity
  const dtw: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(Infinity)
  );

  dtw[0][0] = 0;

  for (let i = 1; i <= n; i++) {
    const uVal = userSeries[i - 1];
    // Penanganan nilai NaN/invalid
    const safeUVal = Number.isFinite(uVal) ? uVal : 0;

    for (let j = 1; j <= m; j++) {
      const rVal = referenceSeries[j - 1];
      const safeRVal = Number.isFinite(rVal) ? rVal : 0;

      const cost = Math.abs(safeUVal - safeRVal);
      dtw[i][j] = cost + Math.min(dtw[i - 1][j], dtw[i][j - 1], dtw[i - 1][j - 1]);
    }
  }

  const totalDistance = dtw[n][m];
  // Normalisasi berdasarkan estimasi panjang jalur warped (n + m)
  const normalizedDistance = totalDistance / (n + m);

  return Math.round(normalizedDistance * 100) / 100;
}

/**
 * Menghitung skor Normalized Cross-Correlation (NCC) antara dua deret waktu sudut.
 * Rentang nilai: -1.0 (korelasi berlawanan) hingga 1.0 (korelasi sempurna).
 * 
 * @param userSeries Deret waktu sudut pengguna
 * @param referenceSeries Deret waktu sudut referensi
 * @returns Skor NCC (-1.0 s/d 1.0)
 */
export function calculateNCCSimilarity(userSeries: number[], referenceSeries: number[]): number {
  if (!userSeries || userSeries.length === 0 || !referenceSeries || referenceSeries.length === 0) {
    return 0;
  }

  // Samakan ukuran sampel menggunakan interpolasi linier jika panjang berbeda
  const alignedUserSeries =
    userSeries.length === referenceSeries.length
      ? userSeries
      : normalizeTimeSeries(userSeries, referenceSeries.length);

  const len = referenceSeries.length;

  // Hitung mean
  let meanUser = 0;
  let meanRef = 0;
  for (let i = 0; i < len; i++) {
    meanUser += alignedUserSeries[i];
    meanRef += referenceSeries[i];
  }
  meanUser /= len;
  meanRef /= len;

  // Hitung pembilang dan penyebut NCC
  let numerator = 0;
  let denomUser = 0;
  let denomRef = 0;

  for (let i = 0; i < len; i++) {
    const diffUser = alignedUserSeries[i] - meanUser;
    const diffRef = referenceSeries[i] - meanRef;

    numerator += diffUser * diffRef;
    denomUser += diffUser * diffUser;
    denomRef += diffRef * diffRef;
  }

  const denominator = Math.sqrt(denomUser * denomRef);
  if (denominator === 0) {
    return 0;
  }

  const ncc = numerator / denominator;
  // Clamp ke rentang [-1.0, 1.0]
  const clampedNcc = Math.max(-1.0, Math.min(1.0, ncc));

  return Math.round(clampedNcc * 1000) / 1000;
}

/**
 * Menghitung skor kemiripan total gerakan aktif vs golden reference data.
 * Memadukan jarak DTW dan korelasi NCC menjadi persentase 0-100% dan penentuan zona aman 3 warna.
 * 
 * @param userSeries Array sudut fleksi lutut aktif pengguna
 * @param referenceSeries Array sudut fleksi lutut referensi (golden data)
 * @returns SimilarityResult (dtwDistance, similarityScorePercent, nccScore, zone)
 */
export function calculateMovementSimilarity(
  userSeries: number[],
  referenceSeries: number[]
): SimilarityResult {
  const dtwDistance = calculateDTWDistance(userSeries, referenceSeries);
  const nccScore = calculateNCCSimilarity(userSeries, referenceSeries);

  if (!Number.isFinite(dtwDistance)) {
    return {
      dtwDistance: Infinity,
      similarityScorePercent: 0,
      nccScore: 0,
      zone: 'RED',
    };
  }

  // Jarak DTW ter-normalisasi merepresentasikan rata-rata selisih sudut (derajat) per sampel.
  // Selisih 0° = 100% cocok. Selisih 25° atau lebih = 0% cocok.
  const MAX_ACCEPTABLE_ANGLE_DIFF = 25.0; // derajat
  const dtwScore = Math.max(0, 1 - Math.min(dtwDistance, MAX_ACCEPTABLE_ANGLE_DIFF) / MAX_ACCEPTABLE_ANGLE_DIFF);

  // Bobot penggabungan: 75% DTW (bentuk & magnitudo) + 25% NCC (korelasi bentuk gelombang)
  const positiveNcc = Math.max(0, nccScore);
  const combinedScore = dtwScore * 0.75 + positiveNcc * 0.25;

  const similarityScorePercent = Math.round(combinedScore * 100);

  // Penentuan zona umpan balik 3 warna:
  // >80%: GREEN (Sangat baik)
  // 60-80%: YELLOW (Bisa disesuaikan)
  // <60%: RED (Deviasi signifikan / Bahaya)
  let zone: SafetyZone;
  if (similarityScorePercent > 80) {
    zone = 'GREEN';
  } else if (similarityScorePercent >= 60) {
    zone = 'YELLOW';
  } else {
    zone = 'RED';
  }


  return {
    dtwDistance,
    similarityScorePercent,
    nccScore,
    zone,
  };
}
