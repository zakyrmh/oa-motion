import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

const STORAGE_KEY = "oa_motion_medical_profile";

export interface MedicalProfile {
  oaGrade: "grade1" | "grade2" | "grade3";
  painScale: number;
  hasKneeSurgery: boolean;
}

export default function Home() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<MedicalProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore JSON parse error
    }
    return { oaGrade: "grade2", painScale: 4, hasKneeSurgery: false };
  });

  const getPainBadge = (val: number) => {
    if (val <= 3)
      return {
        text: `${val}/10 — NYERI RINGAN`,
        className: "bg-[#d1ffca] text-[#000000]",
      };
    if (val <= 6)
      return {
        text: `${val}/10 — NYERI SEDANG`,
        className: "bg-[#fff100] text-[#000000]",
      };
    return {
      text: `${val}/10 — NYERI BERAT`,
      className: "bg-[#000000] text-[#ffffff]",
    };
  };

  const painBadge = getPainBadge(profile.painScale);

  const handleNext = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // ignore quota error
    }
    navigate("/calibration", { state: profile });
  };

  return (
    <div className="min-h-screen bg-[#e5e5e5] text-[#000000] flex flex-col justify-between max-w-md mx-auto font-sans pb-28">
      {/* Top Bar Header */}
      <header className="sticky top-0 z-20 bg-[#e5e5e5]/90 backdrop-blur-md p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="size-12 rounded-full bg-[#f3f3f3] hover:bg-[#c6c6c6] text-[#000000] border-none shadow-none shrink-0"
            aria-label="Kembali"
          >
            <ArrowLeft className="size-6 text-[#000000]" />
          </Button>
          <Badge className="bg-[#d1ffca] text-[#000000] hover:bg-[#d1ffca] font-mono text-xs tracking-tight rounded-full px-3 py-1 font-semibold uppercase border-none shadow-none">
            LANGKAH 1 DARI 3: PENGATURAN PROFIL
          </Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#000000] px-1">
          PROFIL MEDIS HARIAN
        </h1>
      </header>

      {/* Main Form Body */}
      <main className="p-4 flex flex-col gap-6 flex-1">
        {/* Section 1: OA Severity Grade */}
        <section
          className="flex flex-col gap-3"
          aria-labelledby="oa-grade-heading"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#979797] uppercase">
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
            {[
              {
                id: "grade1",
                title: "GRADE 1 (RINGAN)",
                desc: "Penyempitan celah sendi awal",
              },
              {
                id: "grade2",
                title: "GRADE 2 (SEDANG)",
                desc: "Osteofit bermakna & penyempitan sedang",
              },
              {
                id: "grade3",
                title: "GRADE 3 (BERAT)",
                desc: "Penyempitan celah sendi berat",
              },
            ].map((item) => {
              const isSelected = profile.oaGrade === item.id;
              return (
                <Card
                  key={item.id}
                  onClick={() =>
                    setProfile((prev) => ({
                      ...prev,
                      oaGrade: item.id as MedicalProfile["oaGrade"],
                    }))
                  }
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
                      <span className="text-lg font-bold uppercase tracking-tight text-[#000000]">
                        {item.title}
                      </span>
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
        </section>

        {/* Section 2: Daily Pain Scale (VAS) */}
        <section
          className="flex flex-col gap-3"
          aria-labelledby="pain-scale-heading"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#979797] uppercase">
              02 //
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
                  setProfile((prev) => ({
                    ...prev,
                    painScale: val[0] ?? prev.painScale,
                  }))
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

        {/* Section 3: Medical History Toggle */}
        <section
          className="flex flex-col gap-3"
          aria-labelledby="medical-history-heading"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#979797] uppercase">
              03 //
            </span>
            <h2
              id="medical-history-heading"
              className="text-lg font-bold uppercase tracking-tight text-[#000000]"
            >
              RIWAYAT OPERASI LUTUT
            </h2>
          </div>

          <Card className="bg-[#ffffff] rounded-3xl border-none shadow-none p-5 flex items-center justify-between gap-3">
            <span className="text-base font-bold text-[#000000]">
              Pernah Operasi Lutut?
            </span>
            <div className="flex bg-[#f3f3f3] p-1.5 rounded-full">
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  setProfile((prev) => ({ ...prev, hasKneeSurgery: false }))
                }
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
                onClick={() =>
                  setProfile((prev) => ({ ...prev, hasKneeSurgery: true }))
                }
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
        </section>
      </main>

      {/* Footer CTA */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-[#e5e5e5]/95 backdrop-blur-md z-20">
        <Button
          type="button"
          onClick={handleNext}
          className="w-full h-14 bg-[#000000] hover:bg-[#2f2f2f] text-[#ffffff] font-extrabold text-base uppercase tracking-tight rounded-2xl shadow-none active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          LANJUTKAN KE KALIBRASI KAMERA
        </Button>
      </footer>
    </div>
  );
}
