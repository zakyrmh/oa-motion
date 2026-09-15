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
  private pendingSpeakTimer: ReturnType<typeof setTimeout> | null = null;
  private speakRequestId = 0;

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
    this.speakRequestId += 1;
    if (this.pendingSpeakTimer !== null) {
      clearTimeout(this.pendingSpeakTimer);
      this.pendingSpeakTimer = null;
    }
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
    }
  }

  public speak(text: string, options: TTSOptions = {}): void {
    if (!this.isSupported() || this.isMuted || !text.trim()) return;

    this.cancel();
    const requestId = this.speakRequestId;
    const requestedLanguage = options.lang ?? 'id-ID';
    let attempts = 0;

    const speakWhenVoiceListReady = () => {
      if (requestId !== this.speakRequestId || this.isMuted) return;

      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0 && attempts < 10) {
        attempts += 1;
        this.pendingSpeakTimer = setTimeout(speakWhenVoiceListReady, 100);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = requestedLanguage;
      utterance.rate = options.rate ?? 0.9;
      utterance.pitch = options.pitch ?? 1.0;
      utterance.volume = options.volume ?? 1.0;

      if (options.onEnd) {
        utterance.onend = options.onEnd;
      }

      const normalizedLanguage = requestedLanguage.toLowerCase();
      const languagePrefix = normalizedLanguage.split('-')[0];
      const matchingVoice = voices.find(
        (voice) => voice.lang.toLowerCase() === normalizedLanguage
      ) ?? voices.find(
        (voice) => voice.lang.toLowerCase().startsWith(`${languagePrefix}-`)
      );

      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      this.pendingSpeakTimer = null;
      window.speechSynthesis.speak(utterance);
    };

    speakWhenVoiceListReady();
  }
}

export const ttsEngine = new TTSEngine();
