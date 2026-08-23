import { useState, useCallback, useEffect } from 'react';
import { ttsEngine, soundEffects } from '@/engine/audio';

export function useAudioCoach(initialMuted: boolean = false) {
  const [isMuted, setIsMuted] = useState<boolean>(initialMuted);

  useEffect(() => {
    ttsEngine.setMuted(isMuted);
    soundEffects.setMuted(isMuted);
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const speak = useCallback((text: string) => {
    ttsEngine.speak(text);
  }, []);

  const stopSpeaking = useCallback(() => {
    ttsEngine.cancel();
  }, []);

  const playSuccess = useCallback(() => {
    soundEffects.playSuccessChime();
  }, []);

  const playWarning = useCallback(() => {
    soundEffects.playWarningBeep();
  }, []);

  const playTick = useCallback(() => {
    soundEffects.playHoldTick();
  }, []);

  return {
    isMuted,
    setIsMuted,
    toggleMute,
    speak,
    stopSpeaking,
    playSuccess,
    playWarning,
    playTick,
  };
}
