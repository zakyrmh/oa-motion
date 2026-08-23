import { useState, useEffect, type ReactNode } from 'react';
import type { MedicalProfile } from '@/types/clinical';
import { DEFAULT_MEDICAL_PROFILE, SAFE_ROM_LIMITS } from '@/constants/clinical';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { MedicalProfileContext } from './MedicalProfileContext';

export function MedicalProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<MedicalProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MEDICAL_PROFILE);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // LocalStorage unavailable or parse error
    }
    return DEFAULT_MEDICAL_PROFILE;
  });

  // Keep localStorage synced whenever profile changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MEDICAL_PROFILE, JSON.stringify(profile));
    } catch {
      // Ignore quota errors
    }
  }, [profile]);

  const updateProfile = (updates: Partial<MedicalProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const resetProfile = () => {
    setProfile(DEFAULT_MEDICAL_PROFILE);
  };

  const safetyLimits = SAFE_ROM_LIMITS[profile.oaGrade] || SAFE_ROM_LIMITS.grade2;

  return (
    <MedicalProfileContext.Provider
      value={{
        profile,
        safetyLimits,
        updateProfile,
        setProfile,
        resetProfile,
      }}
    >
      {children}
    </MedicalProfileContext.Provider>
  );
}
