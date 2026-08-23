import { useContext } from 'react';
import { MedicalProfileContext, type MedicalProfileContextValue } from '@/context/MedicalProfileContext';

export function useMedicalProfile(): MedicalProfileContextValue {
  const context = useContext(MedicalProfileContext);
  if (!context) {
    throw new Error('useMedicalProfile must be used within a MedicalProfileProvider');
  }
  return context;
}
