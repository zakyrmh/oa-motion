import type { RepetitionRecord, RepetitionBaseline, FatigueEvaluation } from '@/types/session';

/** Jumlah repetisi awal yang dibutuhkan untuk membangun baseline kelelahan adaptif */
export const REQUIRED_BASELINE_REPS = 3;

/** Ambang batas penurunan kecepatan repetisi (% durasi membengkak) untuk pemicuan fatigueFlag */
export const SPEED_DECAY_THRESHOLD_PERCENT = 30; // > 30% lebih lambat dari baseline

/** Ambang batas kemerosotan puncak fleksi (derajat) untuk pemicuan fatigueFlag */
export const ROM_DECAY_THRESHOLD_DEGREES = 10; // > 10° di bawah baseline peak RoM

/**
 * Membuat baseline kelelahan adaptif dari 2-3 repetisi awal pengguna.
 * @param reps Array dari RepetitionRecord awal
 * @returns RepetitionBaseline
 */
export function createRepetitionBaseline(reps: RepetitionRecord[]): RepetitionBaseline {
  if (!reps || reps.length === 0) {
    return {
      avgDurationMs: 0,
      avgPeakFlexionAngle: 0,
      sampleCount: 0,
      isEstablished: false,
    };
  }

  const validReps = reps.slice(0, REQUIRED_BASELINE_REPS);
  const sampleCount = validReps.length;

  let totalDurationMs = 0;
  let totalPeakAngle = 0;

  for (const rep of validReps) {
    // Gunakan durationMs jika ada, atau estimasi dari holdDurationSeconds * 1000 + 3000ms baseline gerakan
    const duration = rep.durationMs ?? Math.max(3000, rep.holdDurationSeconds * 1000 + 2500);
    totalDurationMs += duration;
    totalPeakAngle += rep.maxFlexionAngle;
  }

  const avgDurationMs = Math.round(totalDurationMs / sampleCount);
  const avgPeakFlexionAngle = Math.round((totalPeakAngle / sampleCount) * 10) / 10;

  return {
    avgDurationMs,
    avgPeakFlexionAngle,
    sampleCount,
    isEstablished: sampleCount >= 2, // Minimal 2 repetisi untuk memadai sebagai baseline
  };
}

/**
 * Mengevaluasi indikasi kelelahan (fatigueFlag) pada repetisi terkini dibandingkan terhadap baseline sesi.
 * 
 * @param currentRep Repetisi yang sedang dievaluasi
 * @param baseline Baseline kelelahan adaptif sesi ini
 * @returns FatigueEvaluation
 */
export function evaluateRepetitionFatigue(
  currentRep: RepetitionRecord,
  baseline: RepetitionBaseline
): FatigueEvaluation {
  if (!baseline.isEstablished) {
    return {
      fatigueFlag: false,
      speedDecayPercent: 0,
      romDecayDegrees: 0,
    };
  }

  const currentDurationMs =
    currentRep.durationMs ?? Math.max(3000, currentRep.holdDurationSeconds * 1000 + 2500);

  // Hitung persentase pembengkakan durasi (speed decay)
  let speedDecayPercent = 0;
  if (baseline.avgDurationMs > 0 && currentDurationMs > baseline.avgDurationMs) {
    speedDecayPercent = Math.round(
      ((currentDurationMs - baseline.avgDurationMs) / baseline.avgDurationMs) * 100
    );
  }

  // Hitung kemerosotan puncak fleksi (RoM decay)
  const romDecayDegrees = Math.max(
    0,
    Math.round((baseline.avgPeakFlexionAngle - currentRep.maxFlexionAngle) * 10) / 10
  );

  const isSpeedFatigued = speedDecayPercent >= SPEED_DECAY_THRESHOLD_PERCENT;
  const isRomFatigued = romDecayDegrees >= ROM_DECAY_THRESHOLD_DEGREES;

  const fatigueFlag = isSpeedFatigued || isRomFatigued;

  let reason: string | undefined;
  if (isSpeedFatigued && isRomFatigued) {
    reason = `Terdeteksi penurunan kecepatan (${speedDecayPercent}%) dan kemerosotan RoM (${romDecayDegrees}°)`;
  } else if (isSpeedFatigued) {
    reason = `Terdeteksi penurunan kecepatan repetisi sebesar ${speedDecayPercent}% dibanding baseline`;
  } else if (isRomFatigued) {
    reason = `Terdeteksi kemerosotan puncak fleksi sendi sebesar ${romDecayDegrees}° dibanding baseline`;
  }

  return {
    fatigueFlag,
    speedDecayPercent,
    romDecayDegrees,
    reason,
  };
}

/**
 * Class stateful tracker untuk mengelola pemantauan kelelahan adaptif secara streaming selama sesi latihan berlangsung.
 */
export class AdaptiveFatigueTracker {
  private reps: RepetitionRecord[] = [];
  private baseline: RepetitionBaseline = {
    avgDurationMs: 0,
    avgPeakFlexionAngle: 0,
    sampleCount: 0,
    isEstablished: false,
  };
  private isFatigued = false;
  private lastEvaluation?: FatigueEvaluation;

  /**
   * Menambahkan repetisi baru dan memperbarui status baseline / kelelahan.
   * @param rep Repetisi yang baru diselesaikan
   * @returns FatigueEvaluation terkini
   */
  public recordRepetition(rep: RepetitionRecord): FatigueEvaluation {
    this.reps.push(rep);

    if (!this.baseline.isEstablished) {
      this.baseline = createRepetitionBaseline(this.reps);
      this.lastEvaluation = {
        fatigueFlag: false,
        speedDecayPercent: 0,
        romDecayDegrees: 0,
      };
      return this.lastEvaluation;
    }

    const evalResult = evaluateRepetitionFatigue(rep, this.baseline);
    if (evalResult.fatigueFlag) {
      this.isFatigued = true;
    }
    this.lastEvaluation = evalResult;
    return evalResult;
  }

  public getBaseline(): RepetitionBaseline {
    return this.baseline;
  }

  public hasTriggeredFatigue(): boolean {
    return this.isFatigued;
  }

  public getLastEvaluation(): FatigueEvaluation | undefined {
    return this.lastEvaluation;
  }

  public reset(): void {
    this.reps = [];
    this.baseline = {
      avgDurationMs: 0,
      avgPeakFlexionAngle: 0,
      sampleCount: 0,
      isEstablished: false,
    };
    this.isFatigued = false;
    this.lastEvaluation = undefined;
  }
}
