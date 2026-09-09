import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Timer,
  CheckCircle2,
  Activity,
  ShieldAlert,
  RotateCcw,
  Home as HomeIcon,
  FileDown,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Header } from '@/components/common/Header';
import { useMedicalProfile } from '@/hooks/useMedicalProfile';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { SAFE_ROM_LIMITS } from '@/constants/clinical';
import { RoMChart, TelerehabReportPrint } from '@/components/features/summary';
import type { MedicalProfile } from '@/types/clinical';
import type { ExerciseSessionSummary } from '@/types/session';

function createFallbackSession(profile: MedicalProfile): ExerciseSessionSummary {
  const limits = SAFE_ROM_LIMITS[profile.oaGrade];
  return {
    sessionId: 'session_demo',
    date: new Date().toISOString(),
    medicalProfile: profile,
    totalRepsCompleted: limits.dailyRepetitionTarget,
    safeRepsCompleted: limits.dailyRepetitionTarget,
    maxFlexionReached: limits.maxSafeFlexionAngle - 4,
    avgHoldDuration: limits.targetHoldDurationSeconds,
    totalDurationSeconds: 165,
    overallFormScore: 94,
    repetitionHistory: Array.from({ length: limits.dailyRepetitionTarget }, (_, i) => ({
      repIndex: i + 1,
      maxFlexionAngle: limits.maxSafeFlexionAngle - ((i % 4) + 2),
      holdDurationSeconds: limits.targetHoldDurationSeconds,
      isSafeRoM: true,
      formScore: 90 + ((i * 3) % 10),
      timestamp: Date.now() - (limits.dailyRepetitionTarget - i) * 12000,
    })),
  };
}

export default function Summary() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useMedicalProfile();

  // Retrieve session summary with lazy state initialization
  const [sessionSummary] = useState<ExerciseSessionSummary>(() => {
    if (location.state && (location.state as ExerciseSessionSummary).sessionId) {
      return location.state as ExerciseSessionSummary;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
      if (stored) {
        return JSON.parse(stored) as ExerciseSessionSummary;
      }
    } catch {
      // Ignore storage errors
    }

    return createFallbackSession(profile);
  });

  const limits = SAFE_ROM_LIMITS[sessionSummary.medicalProfile.oaGrade];
  const redWarnings = sessionSummary.repetitionHistory.filter((r) => !r.isSafeRoM).length;
  const complianceRate =
    sessionSummary.totalRepsCompleted > 0
      ? Math.round(
          (sessionSummary.safeRepsCompleted / sessionSummary.totalRepsCompleted) * 100
        )
      : 100;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleRepeatExercise = () => {
    navigate('/calibration');
  };

  const handleReturnHome = () => {
    navigate('/');
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <>
      {/* Interactive Web UI View (Hidden during Print/PDF Export) */}
      <AppLayout className="pb-28 print:hidden">
        {/* Header */}
        <Header
          title="RINGKASAN LATIHAN"
          stepText="HASIL EVALUASI DIGITAL SPOTTER"
          onBack={handleReturnHome}
        />

        {/* Main Content Body */}
        <main className="p-4 flex flex-col gap-6 flex-1">
          {/* Hero Evaluation Banner Card */}
          <Card className="bg-[#ffffff] rounded-3xl border-2 border-[#000000] p-6 shadow-none flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Badge
                className={`font-mono text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider border-none shadow-none flex items-center gap-1.5 ${
                  redWarnings === 0
                    ? 'bg-[#d1ffca] text-[#000000]'
                    : 'bg-[#fff100] text-[#000000]'
                }`}
              >
                {redWarnings === 0 ? (
                  <>
                    <Sparkles className="size-3.5 text-[#000000]" />
                    STATUS: 100% AMAN & TERKONTROL
                  </>
                ) : (
                  <>
                    <ShieldAlert className="size-3.5 text-[#000000]" />
                    STATUS: ADA PERINGATAN ZONA MERAH
                  </>
                )}
              </Badge>

              <span className="font-mono text-xs text-[#444444] font-semibold uppercase">
                SKOR FORM: {sessionSummary.overallFormScore}/100
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#000000]">
                {redWarnings === 0
                  ? 'LATIHAN MANDIRI TUNTAS DENGAN SANGAT BAIK!'
                  : 'LATIHAN SELESAI DENGAN CATATAN KESELAMATAN'}
              </h2>
              <p className="text-sm font-medium text-[#444444] leading-relaxed">
                {redWarnings === 0
                  ? 'Luar biasa! Seluruh gerakan squat Anda terkontrol dengan stabil di dalam zona aman. Tidak ada indikasi stres kompresif berlebih pada sendi lutut.'
                  : 'Anda telah menyelesaikan latihan dengan baik. Terdapat beberapa pengulangan di mana sudut lutut mendekati atau melebihi batas aman. Tetap jaga kedalaman squat yang nyaman.'}
              </p>
            </div>

            <div className="pt-2 border-t border-[#e5e5e5] flex items-center justify-between text-xs font-mono text-[#444444] font-bold uppercase flex-wrap gap-2">
              <span>PROFIL: {sessionSummary.medicalProfile.oaGrade.toUpperCase()}</span>
              <span>
                TARGET:{' '}
                {sessionSummary.medicalProfile.targetKnee === 'right'
                  ? 'LUTUT KANAN'
                  : 'LUTUT KIRI'}
              </span>
              <span>BATAS AMAN: {limits.maxSafeFlexionAngle}°</span>
            </div>
          </Card>

          {/* 4 Core Metrics Grid */}
          <section className="flex flex-col gap-3" aria-labelledby="metrics-heading">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-[#979797] uppercase font-bold">
                01 //
              </span>
              <h3
                id="metrics-heading"
                className="font-mono text-xs text-[#000000] uppercase font-bold tracking-tight"
              >
                METRIK UTAMA LATIHAN MANDIRI
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Metric 1: Duration */}
              <Card className="bg-[#ffffff] rounded-2xl border-2 border-[#000000] p-4 shadow-none flex flex-col justify-between">
                <span className="font-mono text-[11px] text-[#979797] uppercase font-bold tracking-tight">
                  DURASI SESI
                </span>
                <div className="flex items-baseline gap-1 my-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-[#000000]">
                    {formatTime(sessionSummary.totalDurationSeconds)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono text-[#444444] font-semibold">
                  <Timer className="size-3.5 text-[#000000]" />
                  <span>Waktu Aktif</span>
                </div>
              </Card>

              {/* Metric 2: Repetitions Compliance */}
              <Card className="bg-[#ffffff] rounded-2xl border-2 border-[#000000] p-4 shadow-none flex flex-col justify-between">
                <span className="font-mono text-[11px] text-[#979797] uppercase font-bold tracking-tight">
                  REPETISI AMAN
                </span>
                <div className="flex items-baseline gap-1 my-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-[#000000]">
                    {sessionSummary.safeRepsCompleted}
                  </span>
                  <span className="text-sm font-mono text-[#979797]">
                    /{sessionSummary.totalRepsCompleted}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono text-[#10B981] font-bold">
                  <CheckCircle2 className="size-3.5" />
                  <span>{complianceRate}% Kepatuhan</span>
                </div>
              </Card>

              {/* Metric 3: Peak RoM Flexion */}
              <Card className="bg-[#ffffff] rounded-2xl border-2 border-[#000000] p-4 shadow-none flex flex-col justify-between">
                <span className="font-mono text-[11px] text-[#979797] uppercase font-bold tracking-tight">
                  PUNCAK FLEKSI
                </span>
                <div className="flex items-baseline gap-1 my-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-[#000000]">
                    {sessionSummary.maxFlexionReached}°
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono text-[#444444] font-semibold">
                  <Activity className="size-3.5 text-[#000000]" />
                  <span>Batas: {limits.maxSafeFlexionAngle}°</span>
                </div>
              </Card>

              {/* Metric 4: Red Zone Warnings */}
              <Card className="bg-[#ffffff] rounded-2xl border-2 border-[#000000] p-4 shadow-none flex flex-col justify-between">
                <span className="font-mono text-[11px] text-[#979797] uppercase font-bold tracking-tight">
                  ZONA MERAH
                </span>
                <div className="flex items-baseline gap-1 my-2">
                  <span
                    className={`text-2xl sm:text-3xl font-black font-mono ${
                      redWarnings > 0 ? 'text-[#DC2626]' : 'text-[#000000]'
                    }`}
                  >
                    {redWarnings}x
                  </span>
                </div>
                <div
                  className={`flex items-center gap-1 text-[11px] font-mono font-semibold ${
                    redWarnings > 0 ? 'text-[#DC2626]' : 'text-[#10B981]'
                  }`}
                >
                  <ShieldAlert className="size-3.5" />
                  <span>{redWarnings === 0 ? 'Bebas Bahaya' : 'Terdeteksi'}</span>
                </div>
              </Card>
            </div>
          </section>

          {/* T-013: RoM Angle Flexion Chart Visualization */}
          <section className="flex flex-col gap-3" aria-labelledby="chart-heading">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-[#979797] uppercase font-bold">
                02 //
              </span>
              <h3
                id="chart-heading"
                className="font-mono text-xs text-[#000000] uppercase font-bold tracking-tight"
              >
                VISUALISASI GRAFIK TREN FLEKSI LUTUT
              </h3>
            </div>

            <RoMChart
              repetitionHistory={sessionSummary.repetitionHistory}
              oaGrade={sessionSummary.medicalProfile.oaGrade}
            />
          </section>

          {/* Repetition History Breakdown */}
          <section className="flex flex-col gap-3" aria-labelledby="reps-heading">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#979797] uppercase font-bold">
                  03 //
                </span>
                <h3
                  id="reps-heading"
                  className="font-mono text-xs text-[#000000] uppercase font-bold tracking-tight"
                >
                  LOG DETAIL TIAP REPETISI
                </h3>
              </div>
              <span className="font-mono text-[11px] text-[#979797] font-semibold uppercase">
                {sessionSummary.repetitionHistory.length} REPETISI TERCATAT
              </span>
            </div>

            <Card className="bg-[#ffffff] rounded-3xl border-2 border-[#000000] p-4 sm:p-5 shadow-none divide-y divide-[#e5e5e5]">
              {sessionSummary.repetitionHistory.length === 0 ? (
                <p className="text-sm font-medium text-[#979797] text-center py-4">
                  Belum ada data repetisi yang tercatat dalam sesi ini.
                </p>
              ) : (
                sessionSummary.repetitionHistory.map((rep) => (
                  <div
                    key={rep.repIndex}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`size-8 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                          rep.isSafeRoM
                            ? 'bg-[#d1ffca] text-[#000000]'
                            : 'bg-[#fff100] text-[#000000]'
                        }`}
                      >
                        #{rep.repIndex}
                      </div>

                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#000000]">
                          Fleksi Maksimal: {rep.maxFlexionAngle}°
                        </span>
                        <span className="text-xs font-mono text-[#979797]">
                          Waktu Tahan: {rep.holdDurationSeconds} detik
                        </span>
                      </div>
                    </div>

                    <Badge
                      className={`font-mono text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase border-none shadow-none shrink-0 ${
                        rep.isSafeRoM
                          ? 'bg-[#d1ffca] text-[#000000]'
                          : 'bg-[#EF4444] text-[#ffffff]'
                      }`}
                    >
                      {rep.isSafeRoM ? 'AMAN' : 'OVERFLEX'}
                    </Badge>
                  </div>
                ))
              )}
            </Card>
          </section>

          {/* Action Buttons Section */}
          <section className="flex flex-col gap-3 pt-2">
            {/* Action 1: Repeat Exercise */}
            <Button
              onClick={handleRepeatExercise}
              className="w-full h-14 rounded-2xl bg-[#000000] hover:bg-[#222222] text-[#ffffff] font-bold text-base uppercase tracking-wider shadow-none flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform"
            >
              <RotateCcw className="size-5 text-[#d1ffca]" />
              LATIHAN LAGI // MULAI SESI BARU
            </Button>

            {/* Action 2: PDF Export / Telerehab Share (T-014) */}
            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              className="w-full h-14 rounded-2xl bg-[#d1ffca] hover:bg-[#c2f7bb] text-[#000000] border-2 border-[#000000] font-bold text-base uppercase tracking-wider shadow-none flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform"
            >
              <FileDown className="size-5 text-[#000000]" />
              UNDUH / CETAK LAPORAN PDF (TELEREHABILITASI)
            </Button>

            {/* Action 3: Return to Home */}
            <Button
              onClick={handleReturnHome}
              variant="ghost"
              className="w-full h-12 rounded-2xl text-[#444444] hover:text-[#000000] hover:bg-[#c6c6c6]/20 font-bold text-sm uppercase tracking-wider"
            >
              <HomeIcon className="size-4 mr-2" />
              Kembali ke Profil Medis
            </Button>
          </section>
        </main>
      </AppLayout>

      {/* Printable Clinical PDF Report View (Active only when printed via window.print()) */}
      <TelerehabReportPrint sessionSummary={sessionSummary} />
    </>
  );
}
