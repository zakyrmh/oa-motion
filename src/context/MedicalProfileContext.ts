import { createContext, type Dispatch, type SetStateAction } from 'react';
import type { MedicalProfile, ClinicalSafetyLimits } from '@/types/clinical';

export interface MedicalProfileContextValue {
  profile: MedicalProfile;
  safetyLimits: ClinicalSafetyLimits;
  updateProfile: (updates: Partial<MedicalProfile>) => void;
  setProfile: Dispatch<SetStateAction<MedicalProfile>>;
  resetProfile: () => void;
}

export const MedicalProfileContext = createContext<MedicalProfileContextValue | undefined>(undefined);
