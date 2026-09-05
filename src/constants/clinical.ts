import type { ClinicalSafetyLimits, OAGrade, PainBadgeConfig, TargetKnee } from '@/types/clinical';

export const DEFAULT_MEDICAL_PROFILE = {
  oaGrade: 'grade2' as OAGrade,
  painScale: 4,
  hasKneeSurgery: false,
  targetKnee: 'left' as TargetKnee,
};

export const TARGET_KNEE_OPTIONS = [
  {
    id: 'left' as TargetKnee,
    title: 'LUTUT KIRI',
    desc: 'Fokus kaki kiri',
  },
  {
    id: 'right' as TargetKnee,
    title: 'LUTUT KANAN',
    desc: 'Fokus kaki kanan',
  },
  {
    id: 'both' as TargetKnee,
    title: 'KEDUA LUTUT',
    desc: 'Latihan bilateral',
  },
] as const;

export const OA_GRADE_OPTIONS = [
  {
    id: 'grade1' as OAGrade,
    title: 'GRADE 1 (RINGAN)',
    desc: 'Penyempitan celah sendi awal',
    maxSafeFlexionAngle: 100,
  },
  {
    id: 'grade2' as OAGrade,
    title: 'GRADE 2 (SEDANG)',
    desc: 'Osteofit bermakna & penyempitan sedang',
    maxSafeFlexionAngle: 90,
  },
  {
    id: 'grade3' as OAGrade,
    title: 'GRADE 3 (BERAT)',
    desc: 'Penyempitan celah sendi berat',
    maxSafeFlexionAngle: 75,
  },
] as const;

export const SAFE_ROM_LIMITS: Record<OAGrade, ClinicalSafetyLimits> = {
  grade1: {
    oaGrade: 'grade1',
    maxSafeFlexionAngle: 100,
    targetHoldDurationSeconds: 5,
    dailyRepetitionTarget: 10,
    description: 'Batas fleksi lutut aman hingga 100° dengan tahanan 5 detik.',
  },
  grade2: {
    oaGrade: 'grade2',
    maxSafeFlexionAngle: 90,
    targetHoldDurationSeconds: 5,
    dailyRepetitionTarget: 10,
    description: 'Batas fleksi lutut aman hingga 90° (sudut siku-siku) dengan tahanan 5 detik.',
  },
  grade3: {
    oaGrade: 'grade3',
    maxSafeFlexionAngle: 75,
    targetHoldDurationSeconds: 3,
    dailyRepetitionTarget: 8,
    description: 'Batas fleksi lutut maksimal 75° untuk menghindari kompresi sendi tibiofemoral berlebih.',
  },
};

export function getPainBadgeConfig(val: number): PainBadgeConfig {
  if (val <= 3) {
    return {
      text: `${val}/10 — NYERI RINGAN`,
      className: 'bg-[#d1ffca] text-[#000000]',
      severity: 'mild',
    };
  }
  if (val <= 6) {
    return {
      text: `${val}/10 — NYERI SEDANG`,
      className: 'bg-[#fff100] text-[#000000]',
      severity: 'moderate',
    };
  }
  return {
    text: `${val}/10 — NYERI BERAT`,
    className: 'bg-[#000000] text-[#ffffff]',
    severity: 'severe',
  };
}
