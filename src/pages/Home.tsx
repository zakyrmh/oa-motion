import { useNavigate } from "react-router-dom";
import { CheckCircle2, ShieldAlert, ArrowRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Header } from "@/components/common/Header";
import { useMedicalProfile } from "@/hooks/useMedicalProfile";
import {
  OA_GRADE_OPTIONS,
  TARGET_KNEE_OPTIONS,
  getPainBadgeConfig,
} from "@/constants/clinical";
import type { OAGrade, TargetKnee } from "@/types/clinical";

export default function Home() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useMedicalProfile();

  const painBadge = getPainBadgeConfig(profile.painScale);

  const handleNext = () => {
    navigate("/calibration");
  };

  return (
    <AppLayout className="pb-32">
      {/* Top Bar Header */}
      <Header
        title="PROFIL MEDIS HARIAN"
        stepText="LANGKAH 1 DARI 3: PENGATURAN PROFIL"
        onBack={() => navigate("/")}
      />

      {/* Main Form Body */}
      <main className="p-4 flex flex-col gap-6 flex-1">
        {/* Medical Disclaimer & Safety Banner */}
        <section
          aria-labelledby="disclaimer-heading"
          className="flex flex-col gap-2"
        >
          <Card className="bg-[#ffffff] rounded-3xl border-2 border-[#000000] p-5 sm:p-6 shadow-none flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <Badge className="bg-[#fff100] text-[#000000] hover:bg-[#fff100] font-mono text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider border-none shadow-none flex items-center gap-1.5">
                <ShieldAlert className="size-4 text-[#000000]" />
                DISCLAIMER MEDIS // PENTING
              </Badge>
              <span className="font-mono text-[11px] text-[#444444] uppercase tracking-tight font-semibold">
                SFT 2026 MVP PROTOTYPE
              </span>
            </div>

            <div className="flex flex-col gap-2.5 text-[#000000]">
              <h2
                id="disclaimer-heading"
                className="text-base sm:text-lg font-bold uppercase tracking-tight flex items-center gap-2 text-[#000000]"
              >
                PANDUAN KEAMANAN & BATASAN PENGGUNAAN
              </h2>

              <ul className="text-sm font-medium text-[#444444] space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-[#000000] font-bold shrink-0">•</span>
                  <span>
                    <strong className="text-[#000000]">Alat Bantu Mandiri:</strong> OA-Motion
                    berfungsi sebagai sistem panduan latihan (<em>Digital Spotter</em>) dan{" "}
                    <strong>bukan alat diagnostik klinis</strong> atau pengganti fisioterapis.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#000000] font-bold shrink-0">•</span>
                  <span>
                    <strong className="text-[#000000]">Pengecualian Mutlak OA Grade 4:</strong>{" "}
                    Aplikasi ini <strong>TIDAK DITUJUKAN</strong> untuk penderita OA Grade 4
                    (penyempitan celah sendi total/berat) atau kondisi pasca-operasi tanpa izin dokter.
                    Kondisi ini memerlukan pengawasan klinis langsung.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#000000] font-bold shrink-0">•</span>
                  <span>
                    <strong className="text-[#000000]">Hentikan Jika Nyeri:</strong> Lakukan gerakan
                    secara perlahan. Jika merasakan nyeri tajam yang menusuk, segera hentikan latihan.
                  </span>
                </li>
              </ul>
            </div>
          </Card>
        </section>

        {/* Section 01: OA Severity Grade */}
        <section
          className="flex flex-col gap-3"
          aria-labelledby="oa-grade-heading"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#979797] uppercase font-bold">
              01 //
            </span>
            <h2
              id="oa-grade-heading"
              className="text-lg font-bold uppercase tracking-tight text-[#000000]"
            >
              TINGKAT KEPARAHAN OA (LUTUT)
            </h2>
          </div>

          <div
            className="flex flex-col gap-3"
            role="radiogroup"
            aria-label="Tingkat Keparahan OA"
          >
            {OA_GRADE_OPTIONS.map((item) => {
              const isSelected = profile.oaGrade === item.id;
              return (
                <Card
                  key={item.id}
                  onClick={() => updateProfile({ oaGrade: item.id as OAGrade })}
                  className={`cursor-pointer transition-all rounded-3xl border-2 shadow-none ${
                    isSelected
                      ? "bg-[#ffffff] border-[#000000] ring-4 ring-[#d1ffca]"
                      : "bg-[#ffffff] border-[#c6c6c6] hover:border-[#000000]"
                  }`}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                >
                  <CardContent className="p-5 flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg font-bold uppercase tracking-tight text-[#000000]">
                          {item.title}
                        </span>
                        <Badge className="bg-[#f3f3f3] text-[#000000] font-mono text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-[#c6c6c6] shadow-none">
                          BATAS AMAN: {item.maxSafeFlexionAngle}°
                        </Badge>
                      </div>
                      <span className="text-sm font-medium text-[#444444]">
                        {item.desc}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="size-8 rounded-full bg-[#000000] flex items-center justify-center text-[#d1ffca] shrink-0">
                        <CheckCircle2 className="size-6 stroke-[2.5]" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="p-3.5 bg-[#d1ffca] rounded-2xl border border-[#000000] text-xs text-[#000000] font-medium">
            <strong>Arti sudut fleksi:</strong> berdiri tegak = 0°, sudut siku-siku = 90°,
            sedangkan 100° berarti lutut menekuk lebih dalam dari siku-siku. Angka ini bukan
            sudut internal antara paha dan betis.
          </div>

          {/* Grade 4 Exclusion Notice Callout */}
          <div className="p-3.5 bg-[#f3f3f3] rounded-2xl border border-[#c6c6c6] flex items-center gap-2.5 text-xs text-[#444444] font-medium">
            <AlertTriangle className="size-4 text-[#000000] shrink-0" />
            <span>
              <strong>Catatan Klinis:</strong> OA Grade 4 tidak tersedia untuk latihan mandiri demi
              mencegah stres kompresif sendi berlebih tanpa pendamping medis.
            </span>
          </div>
        </section>

        {/* Section 02: Target Knee Selector */}
        <section
          className="flex flex-col gap-3"
          aria-labelledby="target-knee-heading"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#979797] uppercase font-bold">
              02 //
            </span>
            <h2
              id="target-knee-heading"
              className="text-lg font-bold uppercase tracking-tight text-[#000000]"
            >
              TARGET SISI LUTUT YANG DILATIH
            </h2>
          </div>

          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            role="radiogroup"
            aria-label="Target Sisi Lutut"
          >
            {TARGET_KNEE_OPTIONS.map((item) => {
              const isSelected = profile.targetKnee === item.id;
              return (
                <Card
                  key={item.id}
                  onClick={() => updateProfile({ targetKnee: item.id as TargetKnee })}
                  className={`cursor-pointer transition-all rounded-3xl border-2 shadow-none ${
                    isSelected
                      ? "bg-[#ffffff] border-[#000000] ring-4 ring-[#d1ffca]"
                      : "bg-[#ffffff] border-[#c6c6c6] hover:border-[#000000]"
                  }`}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                >
                  <CardContent className="p-4 sm:p-5 flex items-center sm:flex-col sm:items-start justify-between gap-2 min-h-[72px]">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-base sm:text-lg font-bold uppercase tracking-tight text-[#000000]">
                        {item.title}
                      </span>
                      <span className="text-xs font-medium text-[#444444]">
                        {item.desc}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="size-7 rounded-full bg-[#000000] flex items-center justify-center text-[#d1ffca] shrink-0 sm:self-end">
                        <CheckCircle2 className="size-5 stroke-[2.5]" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Section 03: Daily Pain Scale (VAS) */}
        <section
          className="flex flex-col gap-3"
          aria-labelledby="pain-scale-heading"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#979797] uppercase font-bold">
              03 //
            </span>
            <h2
              id="pain-scale-heading"
              className="text-lg font-bold uppercase tracking-tight text-[#000000]"
            >
              SKALA NYERI LUTUT HARI INI (VAS)
            </h2>
          </div>

          <Card className="bg-[#ffffff] rounded-3xl border-none shadow-none p-6 flex flex-col gap-6">
            <div className="flex justify-center">
              <Badge
                className={`font-mono text-sm uppercase px-4 py-2 rounded-full border-none shadow-none font-bold ${painBadge.className}`}
              >
                {painBadge.text}
              </Badge>
            </div>

            <div className="flex flex-col gap-4">
              <Slider
                value={[profile.painScale]}
                onValueChange={(val) =>
                  updateProfile({ painScale: val[0] ?? profile.painScale })
                }
                min={1}
                max={10}
                step={1}
                className="w-full py-2"
                aria-label="Skala Nyeri 1 sampai 10"
              />
              <div className="flex justify-between font-mono text-xs text-[#444444] font-semibold px-1">
                <span>1 (RINGAN)</span>
                <span>5 (SEDANG)</span>
                <span>10 (PARAH)</span>
              </div>
            </div>
          </Card>
        </section>

        {/* Section 04: Medical History Toggle */}
        <section
          className="flex flex-col gap-3"
          aria-labelledby="medical-history-heading"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#979797] uppercase font-bold">
              04 //
            </span>
            <h2
              id="medical-history-heading"
              className="text-lg font-bold uppercase tracking-tight text-[#000000]"
            >
              RIWAYAT OPERASI LUTUT
            </h2>
          </div>

          <Card className="bg-[#ffffff] rounded-3xl border-none shadow-none p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-bold text-[#000000]">
                Pernah Operasi Lutut?
              </span>
              <span className="text-xs font-medium text-[#444444]">
                Rekonstruksi ACL, meniskus, atau artroskopi
              </span>
            </div>
            <div className="flex bg-[#f3f3f3] p-1.5 rounded-full shrink-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => updateProfile({ hasKneeSurgery: false })}
                className={`h-11 px-5 rounded-full font-bold text-sm shadow-none transition-all ${
                  !profile.hasKneeSurgery
                    ? "bg-[#000000] text-[#ffffff] hover:bg-[#000000] hover:text-[#ffffff]"
                    : "text-[#444444] hover:text-[#000000] hover:bg-transparent"
                }`}
              >
                TIDAK
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => updateProfile({ hasKneeSurgery: true })}
                className={`h-11 px-5 rounded-full font-bold text-sm shadow-none transition-all ${
                  profile.hasKneeSurgery
                    ? "bg-[#000000] text-[#ffffff] hover:bg-[#000000] hover:text-[#ffffff]"
                    : "text-[#444444] hover:text-[#000000] hover:bg-transparent"
                }`}
              >
                YA
              </Button>
            </div>
          </Card>

          {profile.hasKneeSurgery && (
            <div className="p-3.5 bg-[#fff100]/20 border border-[#fff100] rounded-2xl text-xs text-[#000000] font-medium flex items-center gap-2">
              <AlertTriangle className="size-4 text-[#000000] shrink-0" />
              <span>
                <strong>Perhatian:</strong> Pastikan Anda telah memperoleh izin dan arahan gerak dari
                dokter spesialis bedah ortopedi atau fisioterapis sebelum memulai latihan fleksi sendi.
              </span>
            </div>
          )}
        </section>
      </main>

      {/* Footer CTA */}
      <footer className="fixed bottom-0 left-0 right-0 w-full max-w-md md:max-w-2xl lg:max-w-3xl mx-auto p-4 bg-[#e5e5e5]/95 backdrop-blur-md z-20">
        <Button
          type="button"
          onClick={handleNext}
          className="w-full h-14 bg-[#000000] hover:bg-[#2f2f2f] text-[#ffffff] font-extrabold text-base uppercase tracking-tight rounded-2xl shadow-none active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          <span>LANJUTKAN KE KALIBRASI KAMERA</span>
          <ArrowRight className="size-5" />
        </Button>
      </footer>
    </AppLayout>
  );
}
