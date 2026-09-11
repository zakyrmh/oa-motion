import { useState, useEffect, type ReactNode } from 'react';
import type { UserProfile } from '@/types/clinical';
import { DEFAULT_USER_PROFILE } from '@/constants/clinical';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { MedicalProfileContext } from './MedicalProfileContext';

export function MedicalProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MEDICAL_PROFILE);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<UserProfile>;
        if (parsed.kapabilitas && parsed.pendampingan && parsed.targetRepetisiPerSesi) {
          return { ...DEFAULT_USER_PROFILE, ...parsed };
        }
      }
    } catch {
      // LocalStorage unavailable or parse error
    }
    return DEFAULT_USER_PROFILE;
  });

  // Keep localStorage synced whenever profile changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MEDICAL_PROFILE, JSON.stringify(profile));
    } catch {
      // Ignore quota errors
    }
  }, [profile]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const resetProfile = () => {
    setProfile(DEFAULT_USER_PROFILE);
  };

  return (
    <MedicalProfileContext.Provider
      value={{
        profile,
        updateProfile,
        setProfile,
        resetProfile,
      }}
    >
      {children}
    </MedicalProfileContext.Provider>
  );
}
