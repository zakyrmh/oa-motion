/**
 * Web Speech API Text-To-Speech Engine
 * Standardized Indonesian speech synthesizer with queue & cancellation management.
 */

export interface TTSOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  onEnd?: () => void;
}

class TTSEngine {
  private isMuted: boolean = false;

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.cancel();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public cancel(): void {
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
    }
  }

  public speak(text: string, options: TTSOptions = {}): void {
    if (!this.isSupported() || this.isMuted || !text.trim()) return;

    this.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.lang ?? 'id-ID';
    utterance.rate = options.rate ?? 0.9;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;

    if (options.onEnd) {
      utterance.onend = options.onEnd;
    }

    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find((v) => v.lang.includes('id') || v.lang.includes('ID'));
    if (idVoice) {
      utterance.voice = idVoice;
    }

    window.speechSynthesis.speak(utterance);
  }
}

export const ttsEngine = new TTSEngine();
