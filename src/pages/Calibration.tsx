import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, VolumeX, CheckCircle2, AudioLines, RefreshCw, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layouts/AppLayout';
import { SilhouetteGuide } from '@/components/features/calibration/SilhouetteGuide';
import { calculateKneeAngle } from '@/engine/kinematics/angleCalculator';
import { useCamera } from '@/hooks/useCamera';
import { useAudioCoach } from '@/hooks/useAudioCoach';
import { useMedicalProfile } from '@/hooks/useMedicalProfile';
import { usePoseTracking } from '@/hooks/usePoseTracking';
import { AUDIO_PHRASES } from '@/constants/audioPhrases';
import type { SmoothedPoseFrame } from '@/types/kinematics';

export default function Calibration() {
  const navigate = useNavigate();
  const { profile } = useMedicalProfile();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isBodyAligned, setIsBodyAligned] = useState<boolean>(false);
  const { videoRef, isCameraActive, cameraError, startCamera, toggleFacingMode } = useCamera({
    facingMode: 'user',
    autoStart: true,
  });

  const { isMuted, toggleMute, speak, stopSpeaking } = useAudioCoach(false);

  const drawLegOverlay = useCallback(
    (landmarks: Array<{ x: number; y: number; z?: number }>) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);
      if (landmarks.length < 33) return;

      const toScreen = (point: { x: number; y: number }) => ({
        x: (1 - point.x) * width,
        y: point.y * height,
      });

      const drawLeg = (side: 'left' | 'right', hipIndex: number, kneeIndex: number, ankleIndex: number) => {
        const hip = landmarks[hipIndex];
        const knee = landmarks[kneeIndex];
        const ankle = landmarks[ankleIndex];
        if (!hip || !knee || !ankle) return;

        const hipScreen = toScreen(hip);
        const kneeScreen = toScreen(knee);
        const ankleScreen = toScreen(ankle);
        const angle = calculateKneeAngle(hip, knee, ankle, side);
        if (angle === null) return;
        const label = `FLEKSI LUTUT ${side === 'left' ? 'KIRI' : 'KANAN'}: ${Math.round(angle)}°`;

        ctx.beginPath();
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#d1ffca';
        ctx.moveTo(hipScreen.x, hipScreen.y);
        ctx.lineTo(kneeScreen.x, kneeScreen.y);
        ctx.lineTo(ankleScreen.x, ankleScreen.y);
        ctx.stroke();

        [hipScreen, ankleScreen].forEach((point) => {
          ctx.beginPath();
          ctx.fillStyle = '#ffffff';
          ctx.arc(point.x, point.y, 7, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.beginPath();
        ctx.fillStyle = '#fff100';
        ctx.arc(kneeScreen.x, kneeScreen.y, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000000';
        ctx.stroke();

        ctx.font = 'bold 14px monospace';
        const labelWidth = ctx.measureText(label).width + 18;
        const labelX = Math.min(width - labelWidth - 10, Math.max(10, kneeScreen.x + 16));
        const labelY = Math.min(height - 30, Math.max(10, kneeScreen.y - 15));
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.roundRect(labelX, labelY, labelWidth, 30, 15);
        ctx.fill();
        ctx.fillStyle = '#d1ffca';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, labelX + labelWidth / 2, labelY + 15);
      };

      if (profile.targetKnee === 'left' || profile.targetKnee === 'both') {
        drawLeg('left', 23, 25, 27);
      }
      if (profile.targetKnee === 'right' || profile.targetKnee === 'both') {
        drawLeg('right', 24, 26, 28);
      }
    },
    [profile.targetKnee, videoRef]
  );

  const handlePoseResults = useCallback(
    (frame: SmoothedPoseFrame) => {
      const landmarks = frame.imageLandmarks ?? [];
      drawLegOverlay(landmarks);

      // Dynamic check for crucial landmarks: hips (23, 24), knees (25, 26), ankles (27, 28)
      const requiredIndices = [23, 24, 25, 26, 27, 28];
      const hasCrucialLandmarks =
        landmarks.length >= 33 &&
        requiredIndices.every((idx) => {
          const pt = landmarks[idx];
          return pt !== undefined && (pt.visibility ?? 1) >= 0.50;
        });

      setIsBodyAligned(hasCrucialLandmarks);
    },
    [drawLegOverlay]
  );

  const { isLoading: isPoseLoading } = usePoseTracking(videoRef, {
    onResults: handlePoseResults,
    enabled: isCameraActive,
  });

  // Trigger spoken instruction upon entering calibration
  useEffect(() => {
    speak(AUDIO_PHRASES.CALIBRATION.DISTANCE_INSTRUCTION);
    return () => {
      stopSpeaking();
    };
  }, [speak, stopSpeaking]);

  const handleStartExercise = () => {
    stopSpeaking();
    navigate('/tracking');
  };

  const handleBack = () => {
    stopSpeaking();
    navigate('/');
  };

  return (
    <AppLayout variant="dark" className="relative select-none overflow-hidden">
      {/* Background Camera Feed / Video Viewport */}
      <div className="absolute inset-0 z-0 bg-slate-950 flex items-center justify-center overflow-hidden">
        {isCameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-400 gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-[#d1ffca]">
              {cameraError ? 'STATUS AKSES KAMERA' : 'MEMULAI PREVIEW KAMERA...'}
            </span>
            <p className="text-sm font-medium max-w-xs">
              {cameraError || 'Kamera melacak posisi tubuh Anda secara aman dengan on-device Edge AI.'}
            </p>
            {cameraError && (
              <Button
                variant="outline"
                size="sm"
                onClick={startCamera}
                className="mt-2 rounded-full border-white/20 text-white hover:bg-white/10"
              >
                <RefreshCw className="size-4 mr-2" />
                Coba Lagi
              </Button>
            )}
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-10 w-full h-full object-cover pointer-events-none"
          aria-label="Preview tracking sudut lutut"
        />

        {/* Soft Dark Vignette Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.85)_100%)]" />
      </div>

      {/* Top Bar Header Overlay */}
      <header className="relative z-20 p-4 flex items-center justify-between gap-3 bg-gradient-to-b from-black/80 to-transparent">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="size-12 rounded-full bg-black/40 hover:bg-black/60 text-[#ffffff] border border-white/10 shadow-none shrink-0"
          aria-label="Kembali ke Profil"
        >
          <ArrowLeft className="size-6 text-[#ffffff]" />
        </Button>

        <h1 className="text-xl font-extrabold uppercase tracking-tight text-[#ffffff]">
          KALIBRASI KAMERA
        </h1>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFacingMode}
            className="size-12 rounded-full bg-black/40 hover:bg-black/60 text-[#ffffff] border border-white/10 shadow-none shrink-0"
            aria-label="Ganti Kamera Depan/Belakang"
            title="Ganti Kamera"
          >
            <RefreshCw className="size-5 text-[#ffffff]" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="size-12 rounded-full bg-black/40 hover:bg-black/60 text-[#ffffff] border border-white/10 shadow-none shrink-0"
            aria-label={isMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
          >
            {isMuted ? (
              <VolumeX className="size-6 text-[#979797]" />
            ) : (
              <Volume2 className="size-6 text-[#d1ffca]" />
            )}
          </Button>
        </div>
      </header>

      {/* Center Camera Overlay & Silhouette Bounds */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 gap-4 my-auto">
        {/* Synchronized Distance Badge */}
        <Badge className="bg-[#000000]/90 text-[#d1ffca] border border-[#d1ffca]/50 font-mono text-xs px-4 py-1.5 rounded-full shadow-lg backdrop-blur-md uppercase tracking-wider">
          JARAK IDEAL: 1.5 - 2.0 METER // SEJAJAR LUTUT
        </Badge>

        {/* Bounding Box / Side-Profile Body Silhouette Component */}
        <SilhouetteGuide />

        {/* Dynamic Status Pill Badge */}
        {isPoseLoading ? (
          <Badge className="bg-[#000000]/90 text-[#ffffff] border border-white/20 font-mono text-xs px-4 py-1.5 rounded-full shadow-lg uppercase tracking-wider">
            MEMUAT TRACKING POSE...
          </Badge>
        ) : isBodyAligned ? (
          <Badge className="bg-[#d1ffca] text-[#000000] hover:bg-[#d1ffca] font-mono text-xs px-4 py-1.5 rounded-full font-bold uppercase tracking-wider border-none shadow-lg flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-[#000000] fill-[#d1ffca]" />
            POSISI KAMERA SUDAH PAS
          </Badge>
        ) : (
          <Badge className="bg-[#EF4444] text-[#ffffff] hover:bg-[#EF4444] font-mono text-xs px-4 py-1.5 rounded-full font-bold uppercase tracking-wider border-none shadow-lg flex items-center gap-1.5 animate-pulse">
            <ShieldAlert className="size-4 text-[#ffffff]" />
            POSISIKAN SELURUH TUBUH DI DALAM BINGKAI
          </Badge>
        )}
      </main>

      {/* Lower-Middle Floating Instruction Card & Bottom CTA */}
      <footer className="relative z-20 p-4 flex flex-col gap-4 bg-gradient-to-t from-black via-black/90 to-transparent">
        {/* Audio & Instruction Card */}
        <Card className="bg-[#ffffff] text-[#000000] rounded-[24px] border-none shadow-xl p-4 flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-[#000000] text-[#d1ffca] flex items-center justify-center shrink-0">
            <AudioLines className="size-6 animate-pulse" />
          </div>
          <p className="text-sm sm:text-base font-bold leading-snug text-[#000000]">
            &ldquo;{AUDIO_PHRASES.CALIBRATION.DISTANCE_INSTRUCTION}&rdquo;
          </p>
        </Card>

        {/* Preventive Warning Callout */}
        <div className="p-3 bg-[#fff100]/10 border border-[#fff100]/40 rounded-xl text-xs font-semibold text-[#fff100] flex items-center gap-2">
          <AlertTriangle className="size-4 text-[#fff100] shrink-0" />
          <span>⚠️ Wajib: Gunakan celana ketat/pendek dan pastikan wajah menghadap arah datangnya cahaya</span>
        </div>

        {/* Bottom CTA Button */}
        <Button
          type="button"
          onClick={handleStartExercise}
          className="w-full h-14 bg-[#d1ffca] hover:bg-[#b8f5b0] text-[#000000] font-extrabold text-base uppercase tracking-tight rounded-[16px] shadow-none active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          MULAI LATIHAN SEKARANG
        </Button>
      </footer>
    </AppLayout>
  );
}
