import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, VolumeX, CheckCircle2, AudioLines, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layouts/AppLayout';
import { SilhouetteGuide } from '@/components/features/calibration/SilhouetteGuide';
import { useCamera } from '@/hooks/useCamera';
import { useAudioCoach } from '@/hooks/useAudioCoach';
import { AUDIO_PHRASES } from '@/constants/audioPhrases';

export default function Calibration() {
  const navigate = useNavigate();
  const { videoRef, isCameraActive, cameraError, startCamera, toggleFacingMode } = useCamera({
    facingMode: 'user',
    autoStart: true,
  });

  const { isMuted, toggleMute, speak, stopSpeaking } = useAudioCoach(false);

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
        {/* Floating Distance Badge */}
        <Badge className="bg-[#000000]/90 text-[#d1ffca] border border-[#d1ffca]/50 font-mono text-xs px-4 py-1.5 rounded-full shadow-lg backdrop-blur-md uppercase tracking-wider">
          JARAK IDEAL: SEKITAR 3 METER // SUDUT 45°
        </Badge>

        {/* Bounding Box / Side-Profile Body Silhouette Component */}
        <SilhouetteGuide />

        {/* Status Pill Badge */}
        <Badge className="bg-[#d1ffca] text-[#000000] hover:bg-[#d1ffca] font-mono text-xs px-4 py-1.5 rounded-full font-bold uppercase tracking-wider border-none shadow-lg flex items-center gap-1.5">
          <CheckCircle2 className="size-4 text-[#000000] fill-[#d1ffca]" />
          POSISI KAMERA SUDAH PAS
        </Badge>
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
