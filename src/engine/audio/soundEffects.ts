/**
 * Web Audio API Synthesizer
 * Zero-dependency sound effects generator for real-time auditory biofeedback (Warning beeps, Success chimes).
 */
class SoundEffectsEngine {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playTone(freq: number, durationMs: number = 200, type: OscillatorType = 'sine'): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {
      // Ignore audio synthesis errors
    }
  }

  public playSuccessChime(): void {
    if (this.isMuted) return;
    this.playTone(523.25, 150, 'triangle'); // C5
    setTimeout(() => this.playTone(659.25, 150, 'triangle'), 120); // E5
    setTimeout(() => this.playTone(783.99, 300, 'triangle'), 240); // G5
  }

  public playWarningBeep(): void {
    if (this.isMuted) return;
    this.playTone(880, 200, 'sawtooth'); // A5 warning buzzer
    setTimeout(() => this.playTone(880, 200, 'sawtooth'), 220);
  }

  public playHoldTick(): void {
    if (this.isMuted) return;
    this.playTone(440, 80, 'sine');
  }
}

export const soundEffects = new SoundEffectsEngine();
