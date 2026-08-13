import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  CheckCircle2,
  AudioLines,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Calibration() {
  const navigate = useNavigate();
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraActive(true);
        }
      } catch {
        setIsCameraActive(false);
      }
    }
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[#000000] text-[#ffffff] flex flex-col justify-between max-w-md mx-auto font-sans overflow-hidden select-none">
      {/* Background Camera Feed / Soft Dark Overlay */}
      <div className="absolute inset-0 z-0 bg-slate-900 flex items-center justify-center overflow-hidden">
        {isCameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-b from-slate-900 via-slate-800 to-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <span className="font-mono text-xs uppercase tracking-widest text-[#d1ffca] mb-2">
              SIMULASI PREVIEW KAMERA AR
            </span>
            <p className="text-sm font-medium">
              Kamera melacak posisi tubuh Anda secara Edge-AI
            </p>
          </div>
        )}

        {/* Soft Dark Vignette Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.85)_100%)]" />
      </div>

      {/* Top Bar Header Overlay */}
      <header className="relative z-20 p-4 flex items-center justify-between gap-3 bg-linear-to-b from-black/80 to-transparent">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="size-12 rounded-full bg-black/40 hover:bg-black/60 text-[#ffffff] border border-white/10 shadow-none shrink-0"
          aria-label="Kembali ke Profil"
        >
          <ArrowLeft className="size-6 text-[#ffffff]" />
        </Button>

        <h1 className="text-xl font-extrabold uppercase tracking-tight text-[#ffffff]">
          KALIBRASI KAMERA
        </h1>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsAudioMuted(!isAudioMuted)}
          className="size-12 rounded-full bg-black/40 hover:bg-black/60 text-[#ffffff] border border-white/10 shadow-none shrink-0"
          aria-label={isAudioMuted ? "Nyalakan Suara" : "Matikan Suara"}
        >
          {isAudioMuted ? (
            <VolumeX className="size-6 text-[#979797]" />
          ) : (
            <Volume2 className="size-6 text-[#d1ffca]" />
          )}
        </Button>
      </header>

      {/* Center Camera Overlay & Silhouette Bounds */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 gap-4 my-auto">
        {/* Floating Distance Badge */}
        <Badge className="bg-[#000000]/90 text-[#d1ffca] border border-[#d1ffca]/50 font-mono text-xs px-4 py-1.5 rounded-full shadow-lg backdrop-blur-md uppercase tracking-wider">
          JARAK IDEAL: 1.5 - 2.0 METER
        </Badge>

        {/* Bounding Box / Side-Profile Body Silhouette */}
        <div className="relative w-64 h-80 rounded-4xl border-4 border-dashed border-[#d1ffca] flex flex-col items-center justify-center p-4 bg-[#d1ffca]/5 backdrop-blur-[2px] animate-pulse">
          {/* Side-Profile SVG Silhouette Graphic */}
          <svg
            viewBox="0 0 100 160"
            fill="none"
            stroke="#d1ffca"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-36 h-56 opacity-80"
          >
            {/* Head */}
            <circle cx="50" cy="22" r="12" className="fill-[#d1ffca]/20" />
            {/* Torso Side View */}
            <path d="M48 34 C44 50, 42 75, 46 95" />
            {/* Front Leg & Knee */}
            <path d="M46 95 L56 125 L50 152" />
            {/* Back Leg */}
            <path d="M46 95 L40 125 L44 152" strokeDasharray="3 3" />
            {/* Arm Side Bend */}
            <path d="M48 42 L58 60 L48 78" />
            {/* Knee Landmark Highlight */}
            <circle
              cx="56"
              cy="125"
              r="5"
              fill="#fff100"
              stroke="#000000"
              strokeWidth="2"
            />
          </svg>

          {/* Corner Markers */}
          <div className="absolute top-2 left-2 size-4 border-t-4 border-l-4 border-[#d1ffca]" />
          <div className="absolute top-2 right-2 size-4 border-t-4 border-r-4 border-[#d1ffca]" />
          <div className="absolute bottom-2 left-2 size-4 border-b-4 border-l-4 border-[#d1ffca]" />
          <div className="absolute bottom-2 right-2 size-4 border-b-4 border-r-4 border-[#d1ffca]" />
        </div>

        {/* Status Pill Badge */}
        <Badge className="bg-[#d1ffca] text-[#000000] hover:bg-[#d1ffca] font-mono text-xs px-4 py-1.5 rounded-full font-bold uppercase tracking-wider border-none shadow-lg flex items-center gap-1.5">
          <CheckCircle2 className="size-4 text-[#000000] fill-[#d1ffca]" />
          POSISI KAMERA SUDAH PAS
        </Badge>
      </main>

      {/* Lower-Middle Floating Instruction Card & Bottom CTA */}
      <footer className="relative z-20 p-4 flex flex-col gap-4 bg-linear-to-t from-black via-black/90 to-transparent">
        {/* Audio & Instruction Card */}
        <Card className="bg-[#ffffff] text-[#000000] rounded-3xl border-none shadow-xl p-4 flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-[#000000] text-[#d1ffca] flex items-center justify-center shrink-0">
            <AudioLines className="size-6 animate-pulse" />
          </div>
          <p className="text-sm sm:text-base font-bold leading-snug text-[#000000]">
            &ldquo;Posisikan smartphone sejajar lutut Anda pada jarak 1.5 – 2
            meter&rdquo;
          </p>
        </Card>

        {/* Bottom CTA Button */}
        <Button
          type="button"
          onClick={() => navigate("/tracking")}
          className="w-full h-14 bg-[#d1ffca] hover:bg-[#b8f5b0] text-[#000000] font-extrabold text-base uppercase tracking-tight rounded-2xl shadow-none active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          MULAI LATIHAN SEKARANG
        </Button>
      </footer>
    </div>
  );
}
