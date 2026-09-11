import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Activity, CheckCircle2, FileDown, Home as HomeIcon, RotateCcw, ShieldAlert, Timer, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Header } from '@/components/common/Header';
import { useMedicalProfile } from '@/hooks/useMedicalProfile';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { RoMChart } from '@/components/features/summary/RoMChart';
import { TelerehabReportPrint } from '@/components/features/summary/TelerehabReportPrint';
import type { UserProfile } from '@/types/clinical';
import type { ExerciseSessionSummary } from '@/types/session';

function createFallbackSession(profile: UserProfile): ExerciseSessionSummary {
  return { sessionId: 'session_demo', date: new Date().toISOString(), userProfile: profile, totalRepsCompleted: 0, safeRepsCompleted: 0, maxFlexionReached: 0, avgHoldDuration: 0, totalDurationSeconds: 0, overallFormScore: 0, averageSimilarityScore: 0, repetitionHistory: [], fatigueFlag: false };
}

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}

export default function Summary() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useMedicalProfile();
  const [sessionSummary] = useState<ExerciseSessionSummary>(() => {
    if (location.state && (location.state as ExerciseSessionSummary).sessionId) return location.state as ExerciseSessionSummary;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
      if (stored) return JSON.parse(stored) as ExerciseSessionSummary;
    } catch { /* Ignore invalid storage data. */ }
    return createFallbackSession(profile);
  });
  const safeRate = sessionSummary.totalRepsCompleted ? Math.round(sessionSummary.safeRepsCompleted / sessionSummary.totalRepsCompleted * 100) : 0;
  const warnings = sessionSummary.repetitionHistory.filter((rep) => !rep.isSafeRoM).length;
  const shareText = `Ringkasan OA-Motion ${sessionSummary.userProfile.namaPanggilan || 'pengguna'}: ${sessionSummary.totalRepsCompleted} repetisi, skor kemiripan ${sessionSummary.averageSimilarityScore}%, fatigue flag ${sessionSummary.fatigueFlag ? 'aktif' : 'tidak aktif'}.`;

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Ringkasan OA-Motion', text: shareText });
      return;
    }
    const blob = new Blob([shareText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ringkasan-oa-motion.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return <>
    <AppLayout className="pb-28 print:hidden">
      <Header title="RINGKASAN LATIHAN" stepText="HASIL EVALUASI DIGITAL SPOTTER" onBack={() => navigate('/')} />
      <main className="flex flex-1 flex-col gap-6 p-4">
        <Card className={`flex flex-col gap-4 rounded-3xl border-2 border-black p-6 shadow-none ${sessionSummary.fatigueFlag ? 'bg-[#fff100]' : 'bg-white'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2"><Badge className={`rounded-full border-none px-3 py-1 font-mono text-xs font-bold text-black shadow-none ${sessionSummary.fatigueFlag ? 'bg-white' : 'bg-[#d1ffca]'}`}>{sessionSummary.fatigueFlag ? 'FATIGUE FLAG AKTIF' : 'SESI TERKONTROL'}</Badge><span className="font-mono text-xs font-bold uppercase text-[#444444]">{sessionSummary.userProfile.pendampingan === 'mandiri' ? 'MODE MANDIRI' : 'DENGAN PENDAMPING'}</span></div>
          <div><h2 className="text-xl font-black uppercase tracking-tight">{sessionSummary.userProfile.namaPanggilan ? `SESI ${sessionSummary.userProfile.namaPanggilan.toUpperCase()} SELESAI` : 'SESI LATIHAN SELESAI'}</h2><p className="mt-2 text-sm font-medium leading-relaxed text-[#444444]">Skor kemiripan dihitung dari pola gerakan terhadap data referensi lokal. Hasil ini adalah panduan latihan, bukan diagnosis medis.</p></div>
        </Card>

        <section aria-labelledby="metrics-heading" className="flex flex-col gap-3"><h3 id="metrics-heading" className="font-mono text-xs font-bold uppercase">01 // METRIK SESI</h3><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[['DURASI', formatTime(sessionSummary.totalDurationSeconds), <Timer className="size-4" />], ['REPETISI AMAN', `${sessionSummary.safeRepsCompleted}/${sessionSummary.totalRepsCompleted}`, <CheckCircle2 className="size-4" />], ['SKOR KEMIRIPAN', `${sessionSummary.averageSimilarityScore}%`, <Activity className="size-4" />], ['PERINGATAN', `${warnings}x`, <ShieldAlert className="size-4" />]].map(([label, value, icon]) => <Card key={String(label)} className="flex min-h-32 flex-col justify-between rounded-2xl border-2 border-black bg-white p-4 shadow-none"><span className="font-mono text-[11px] font-bold text-[#979797]">{label}</span><strong className="font-mono text-2xl text-black">{value}</strong><span className="flex items-center gap-1 text-xs font-bold text-[#444444]">{icon}{label === 'REPETISI AMAN' ? `${safeRate}% KEPATUHAN` : label === 'PERINGATAN' && sessionSummary.fatigueFlag ? 'FATIGUE FLAG' : 'HASIL SESI'}</span></Card>)}
        </div></section>

        <section aria-labelledby="chart-heading" className="flex flex-col gap-3"><h3 id="chart-heading" className="font-mono text-xs font-bold uppercase">02 // TREN KEMIRIPAN PER REPETISI</h3><RoMChart repetitionHistory={sessionSummary.repetitionHistory} /></section>
        <section aria-labelledby="log-heading" className="flex flex-col gap-3"><div className="flex items-center justify-between"><h3 id="log-heading" className="font-mono text-xs font-bold uppercase">03 // LOG REPETISI</h3><span className="font-mono text-[11px] font-bold text-[#979797]">TARGET {sessionSummary.userProfile.targetRepetisiPerSesi} REP</span></div><Card className="divide-y divide-[#e5e5e5] rounded-3xl border-2 border-black bg-white p-4 shadow-none">{sessionSummary.repetitionHistory.length ? sessionSummary.repetitionHistory.map((rep) => <div key={`${rep.movementType}-${rep.repIndex}`} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"><div><strong className="text-sm text-black">#{rep.repIndex} {rep.movementType === 'sit_to_stand' ? 'SIT-TO-STAND' : 'SQUAT'}</strong><p className="font-mono text-xs text-[#444444]">Kemiripan {rep.similarityScore ?? rep.formScore}% · Fleksi {rep.maxFlexionAngle}°</p></div><Badge className={`rounded-full border-none px-2.5 py-1 font-mono text-[11px] font-bold shadow-none ${rep.fatigueFlag ? 'bg-[#fff100] text-black' : rep.isSafeRoM ? 'bg-[#d1ffca] text-black' : 'bg-[#EF4444] text-white'}`}>{rep.fatigueFlag ? 'LELAH' : rep.isSafeRoM ? 'SERASI' : 'PERLU ULANG'}</Badge></div>) : <p className="py-4 text-center text-sm font-medium text-[#979797]">Belum ada repetisi yang tercatat.</p>}</Card></section>
        <section className="flex flex-col gap-3 pt-2"><Button onClick={() => navigate('/calibration')} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-black text-base font-bold uppercase text-white shadow-none"><RotateCcw className="size-5 text-[#d1ffca]" /> LATIHAN LAGI</Button><div className="grid gap-3 sm:grid-cols-2"><Button onClick={handleShare} variant="outline" className="h-14 rounded-2xl border-2 border-black bg-[#d1ffca] font-bold uppercase text-black shadow-none"><Share2 className="mr-2 size-5" /> BAGIKAN KELUARGA</Button><Button onClick={() => window.print()} variant="outline" className="h-14 rounded-2xl border-2 border-black bg-white font-bold uppercase text-black shadow-none"><FileDown className="mr-2 size-5" /> CETAK LAPORAN</Button></div><Button onClick={() => navigate('/')} variant="ghost" className="h-12 font-bold uppercase text-[#444444]"><HomeIcon className="mr-2 size-4" /> Kembali ke profil</Button></section>
      </main>
    </AppLayout>
    <TelerehabReportPrint sessionSummary={sessionSummary} />
  </>;
}
