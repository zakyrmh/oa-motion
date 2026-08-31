/**
 * Exponential Moving Average (EMA) Filter
 * Smooths jittery landmark coordinates and joint angles in real-time computer vision streams.
 *
 * Formula: S_t = alpha * Y_t + (1 - alpha) * S_(t-1)
 * where alpha in (0, 1] controls responsiveness vs smoothing.
 */
export class EMAFilter {
  private alpha: number;
  private currentValue: number | null = null;

  constructor(alpha: number = 0.25) {
    this.alpha = Math.max(0.01, Math.min(1.0, alpha));
  }

  /**
   * Filter next value in the stream.
   */
  public filter(newValue: number): number {
    if (this.currentValue === null) {
      this.currentValue = newValue;
      return newValue;
    }

    this.currentValue = this.alpha * newValue + (1 - this.alpha) * this.currentValue;
    return Math.round(this.currentValue * 10) / 10;
  }

  /**
   * Get the current smoothed value without adding a new sample.
   */
  public get(): number | null {
    return this.currentValue;
  }

  /**
   * Reset filter state (e.g. when patient leaves camera frame).
   */
  public reset(): void {
    this.currentValue = null;
  }

  public setAlpha(alpha: number): void {
    this.alpha = Math.max(0.01, Math.min(1.0, alpha));
  }
}
