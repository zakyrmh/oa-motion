import { createContext, type Dispatch, type SetStateAction } from 'react';
import type { UserProfile } from '@/types/clinical';

export interface MedicalProfileContextValue {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setProfile: Dispatch<SetStateAction<UserProfile>>;
  resetProfile: () => void;
}

export const MedicalProfileContext = createContext<MedicalProfileContextValue | undefined>(undefined);
