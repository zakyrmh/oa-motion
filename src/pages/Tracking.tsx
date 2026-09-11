import { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Volume2,
  VolumeX,
  ShieldAlert,
  AlertTriangle,
  Activity,
  Timer,
  Square,
  RefreshCw,
} from 'lucide-react';
import type { SmoothedPoseFrame } from '@/types/kinematics';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layouts/AppLayout';
import { useCamera } from '@/hooks/useCamera';
import { usePoseTracking } from '@/hooks/usePoseTracking';
import { useMedicalProfile } from '@/hooks/useMedicalProfile';
import { useExerciseTracking } from '@/hooks/useExerciseTracking';
import { STORAGE_KEYS } from '@/constants/storageKeys';

export default function Tracking() {
  const navigate = useNavigate();
  const { profile } = useMedicalProfile();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Setup camera
  const {
    videoRef,
    isCameraActive,
    cameraError,
    startCamera,
    stopCamera,
    toggleFacingMode,
  } = useCamera({
    facingMode: 'user',
    autoStart: true,
  });

  // Setup exercise tracking engine
  const {
    currentAngle,
    currentZone,
    currentSimilarityScore,
    activeMovement,
    repsCompleted,
    targetReps,
    redZoneWarnings,
    coachMessage,
    durationSeconds,
    fatigueFlag,
    processFrameLandmarks,
    finishSession,
    audioCoach,
  } = useExerciseTracking({ profile });

  const { isMuted, toggleMute } = audioCoach;

  // Draw skeleton & visual biofeedback on HTML5 Canvas
  const drawOverlay = useCallback(
    (landmarks: SmoothedPoseFrame['imageLandmarks']) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Synchronize canvas buffer resolution with video stream dimensions
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
      }

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (!landmarks || landmarks.length < 33) return;

      const shoulderIdx = 11;
      const hipIdx = 23;
      const kneeIdx = 25;
      const ankleIdx = 27;
      const footIdx = 31;

      // Coordinate mapping with horizontal mirroring to match selfie preview
      const toScreen = (pt: { x: number; y: number }) => ({
        x: (1 - pt.x) * w,
        y: pt.y * h,
      });

      const shoulder = toScreen(landmarks[shoulderIdx]);
      const hip = toScreen(landmarks[hipIdx]);
      const knee = toScreen(landmarks[kneeIdx]);
      const ankle = toScreen(landmarks[ankleIdx]);
      const foot = toScreen(landmarks[footIdx]);

      // Dynamic color coding based on active safety zone
      let zoneColor = '#d1ffca'; // Mint Green (Safe)
      let glowColor = 'rgba(209, 255, 202, 0.4)';
      if (currentZone === 'YELLOW') {
        zoneColor = '#fff100'; // Voltage Yellow (Warning)
        glowColor = 'rgba(255, 241, 0, 0.5)';
      } else if (currentZone === 'RED') {
        zoneColor = '#EF4444'; // Crimson Red (Danger/Overflexion)
        glowColor = 'rgba(239, 68, 68, 0.6)';
      }

      // 1. Draw Torso connector line (Shoulder to Hip)
      ctx.beginPath();
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.moveTo(shoulder.x, shoulder.y);
      ctx.lineTo(hip.x, hip.y);
      ctx.stroke();

      // 2. Draw Leg Vectors (Hip -> Knee -> Ankle)
      ctx.beginPath();
      ctx.lineWidth = 8;
      ctx.strokeStyle = zoneColor;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 12;

      ctx.moveTo(hip.x, hip.y);
      ctx.lineTo(knee.x, knee.y);
      ctx.lineTo(ankle.x, ankle.y);
      ctx.stroke();

      // Reset shadow
      ctx.shadowBlur = 0;

      // 3. Draw Foot connector
      ctx.beginPath();
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.moveTo(ankle.x, ankle.y);
      ctx.lineTo(foot.x, foot.y);
      ctx.stroke();

      // 4. Draw Joint Nodes
      // Hip
      ctx.beginPath();
      ctx.arc(hip.x, hip.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#000000';
      ctx.stroke();

      // Ankle
      ctx.beginPath();
      ctx.arc(ankle.x, ankle.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#000000';
      ctx.stroke();

      // Knee (Highlighted Spotter Vertex)
      ctx.beginPath();
      ctx.arc(knee.x, knee.y, 14, 0, Math.PI * 2);
      ctx.fillStyle = zoneColor;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#000000';
      ctx.stroke();

      // 5. Draw Angle Bubble Tag near knee joint
      const angleText = `${Math.round(currentAngle)}°`;
      ctx.font = 'bold 16px monospace';
      const textMetrics = ctx.measureText(angleText);
      const tagW = textMetrics.width + 20;
      const tagH = 30;
      const tagX = Math.min(w - tagW - 10, Math.max(10, knee.x + 18));
      const tagY = Math.min(h - tagH - 10, Math.max(10, knee.y - 15));

      // Bubble Background
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.roundRect(tagX, tagY, tagW, tagH, 15);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = zoneColor;
      ctx.stroke();

      // Bubble Text
      ctx.fillStyle = zoneColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(angleText, tagX + tagW / 2, tagY + tagH / 2);
    },
    [currentAngle, currentZone, videoRef]
  );

  // Frame results callback from MediaPipe Pose Tracking
  const handlePoseResults = useCallback(
    (frame: SmoothedPoseFrame) => {
      processFrameLandmarks(frame.worldLandmarks);
      drawOverlay(frame.imageLandmarks);
    },
    [processFrameLandmarks, drawOverlay]
  );

  // Connect pose estimation loop
  const { isLoading: isModelLoading, error: modelError } = usePoseTracking(videoRef, {
    onResults: handlePoseResults,
    enabled: isCameraActive,
  });

  // Emergency Stop Action (T-011)
  const handleEmergencyStop = () => {
    const summary = finishSession();
    stopCamera();

    // Persist active session summary into localStorage
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(summary));
    } catch {
      // Ignore storage errors
    }

    // Navigate to Summary Screen with session data
    navigate('/summary', { state: summary });
  };

  // Format MM:SS duration
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Top Zone Banner Config
  const getZoneBannerConfig = () => {
    switch (currentZone) {
      case 'GREEN':
        return {
          title: 'ZONA HIJAU // GERAKAN SERASI',
          desc: `Skor kemiripan ${currentSimilarityScore}%. Gerakan terkontrol.`,
          bg: 'bg-[#d1ffca] text-[#000000]',
          border: 'border-[#d1ffca]',
          icon: <Activity className="size-5 text-[#000000]" />,
        };
      case 'YELLOW':
        return {
          title: 'ZONA KUNING // PERLU DISESUAIKAN',
          desc: `Skor kemiripan ${currentSimilarityScore}%. Perlambat dan ikuti pola referensi.`,
          bg: 'bg-[#fff100] text-[#000000]',
          border: 'border-[#fff100]',
          icon: <AlertTriangle className="size-5 text-[#000000]" />,
        };
      case 'RED':
        return {
          title: 'ZONA MERAH // HENTIKAN SEMENTARA',
          desc: `Skor kemiripan ${currentSimilarityScore}%. Kembali ke posisi nyaman.`,
          bg: 'bg-[#EF4444] text-[#ffffff] animate-pulse',
          border: 'border-[#DC2626]',
          icon: <ShieldAlert className="size-5 text-[#ffffff]" />,
        };
    }
  };

  const zoneBanner = getZoneBannerConfig();
  const progressPercent = Math.min(100, (repsCompleted / targetReps) * 100);

  return (
    <AppLayout variant="dark" className="relative select-none overflow-hidden pb-4">
      {/* 1. Viewport Layer: Webcam & Canvas Overlay */}
      <div className="absolute inset-0 z-0 bg-slate-950 flex items-center justify-center overflow-hidden">
        {isCameraActive ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
          </>
        ) : (
          <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-slate-400 gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-[#d1ffca]">
              {cameraError || modelError ? 'STATUS SISTEM / KAMERA' : 'MEMULAI KAMERA LATIHAN...'}
            </span>
            <p className="text-sm font-medium max-w-xs">
              {cameraError || modelError || 'Mempersiapkan deteksi pose MediaPipe di memori lokal.'}
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

        {/* Loading Overlay while model is loading */}
        {isModelLoading && (
          <div className="absolute inset-0 z-10 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-white">
            <div className="size-10 border-4 border-[#d1ffca] border-t-transparent rounded-full animate-spin" />
            <span className="font-mono text-sm uppercase tracking-wider font-bold text-[#d1ffca]">
              MEMUAT ENGINE MEDIAPIPE WASM...
            </span>
          </div>
        )}

        {/* Soft Vignette Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.85)_100%)]" />
      </div>

      {/* 2. Top Header & Navigation Bar */}
      <header className="relative z-20 p-4 flex items-center justify-between gap-3 bg-gradient-to-b from-black/90 via-black/60 to-transparent">
        <div className="flex items-center gap-2">
          <Badge className="bg-[#d1ffca] text-[#000000] hover:bg-[#d1ffca] font-mono text-xs font-bold px-3 py-1 rounded-full uppercase border-none shadow-none">
            LANGKAH 3 DARI 3: LATIHAN
          </Badge>
          <span className="font-mono text-xs text-white/80 font-semibold uppercase hidden sm:inline">
            {activeMovement === 'sit_to_stand' ? 'TAHAP SIT-TO-STAND' : 'TAHAP SQUAT'} •{' '}
            {profile.pendampingan === 'mandiri' ? 'MODE MANDIRI' : 'DENGAN PENDAMPING'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="size-11 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/10 shadow-none"
            aria-label={isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
          >
            {isMuted ? (
              <VolumeX className="size-5 text-[#fff100]" />
            ) : (
              <Volume2 className="size-5 text-[#d1ffca]" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFacingMode}
            className="size-11 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/10 shadow-none"
            aria-label="Ganti Kamera"
          >
            <RefreshCw className="size-5 text-white" />
          </Button>
        </div>
      </header>

      {/* 3. Real-time Status Banner (3-Zone Indicator) */}
      <div className="relative z-20 px-4 pt-1">
        <div
          className={`rounded-2xl p-3 sm:p-4 border-2 flex items-start gap-3 transition-colors duration-200 ${zoneBanner.bg} ${zoneBanner.border}`}
        >
          <div className="mt-0.5 shrink-0">{zoneBanner.icon}</div>
          <div className="flex flex-col gap-0.5">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider">
              {zoneBanner.title}
            </h2>
            <p className="text-xs font-semibold opacity-90 leading-tight">
              {zoneBanner.desc}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Middle Spacer to keep video clear */}
      <div className="flex-1 pointer-events-none" />

      {/* 5. Bottom Interactive HUD & Emergency Stop */}
      <div className="relative z-20 p-4 flex flex-col gap-3 bg-gradient-to-t from-black via-black/80 to-transparent">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-3 gap-2">
          {/* Card 1: Repetition Counter */}
          <div className="bg-[#000000]/80 border border-white/20 rounded-2xl p-3 flex flex-col items-center text-center backdrop-blur-md">
            <span className="font-mono text-[10px] text-[#979797] uppercase font-bold tracking-tight">
              REPETISI
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                {repsCompleted}
              </span>
              <span className="text-xs font-mono text-[#979797]">/{targetReps}</span>
            </div>
            {/* Mini Progress Bar */}
            <div className="w-full bg-white/10 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-[#d1ffca] h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Card 2: Real-time Flexion Angle */}
          <div className="bg-[#000000]/80 border border-white/20 rounded-2xl p-3 flex flex-col items-center text-center backdrop-blur-md">
            <span className="font-mono text-[10px] text-[#979797] uppercase font-bold tracking-tight">
              SUDUT FLEKSI
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span
                className={`text-2xl sm:text-3xl font-black font-mono ${
                  currentZone === 'RED'
                    ? 'text-[#EF4444]'
                    : currentZone === 'YELLOW'
                    ? 'text-[#fff100]'
                    : 'text-[#d1ffca]'
                }`}
              >
                {currentSimilarityScore}%
              </span>
              <span className="text-xs font-mono text-[#979797]">
                /100%
              </span>
            </div>
            <span className="font-mono text-[9px] text-[#979797] uppercase tracking-tighter mt-1.5">
              SKOR KEMIRIPAN
            </span>
          </div>

          {/* Card 3: Session Duration & Red Warnings */}
          <div className="bg-[#000000]/80 border border-white/20 rounded-2xl p-3 flex flex-col items-center text-center backdrop-blur-md">
            <span className="font-mono text-[10px] text-[#979797] uppercase font-bold tracking-tight">
              WAKTU & PERINGATAN
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Timer className="size-4 text-[#979797]" />
              <span className="text-base sm:text-lg font-black text-white font-mono">
                {formatTime(durationSeconds)}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs">
              <span className="font-mono text-[10px] text-[#979797]">ZONA MERAH:</span>
              <span
                className={`font-mono text-[11px] font-bold ${
                  redZoneWarnings > 0 ? 'text-[#EF4444]' : 'text-[#d1ffca]'
                }`}
              >
                {redZoneWarnings}x
              </span>
            </div>
          </div>
        </div>

        {fatigueFlag && (
          <div className="rounded-2xl border-2 border-[#fff100] bg-[#fff100] p-3 text-center text-sm font-black uppercase text-black">
            INDIKASI KELELAHAN // ISTIRAHAT SEBELUM MELANJUTKAN
          </div>
        )}

        {/* Audio Coach Subtitle Pill */}
        <div className="bg-[#ffffff] text-[#000000] rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 shadow-lg border-2 border-[#000000]">
          <div className="size-7 rounded-full bg-[#d1ffca] flex items-center justify-center shrink-0">
            <Volume2 className="size-4 text-[#000000]" />
          </div>
          <p className="text-xs sm:text-sm font-bold text-[#000000] tracking-tight line-clamp-2">
            {coachMessage}
          </p>
        </div>

        {/* Emergency Stop Button (T-011) */}
        <Button
          onClick={handleEmergencyStop}
          className="w-full h-14 rounded-2xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-black text-base uppercase tracking-wider shadow-none border-2 border-[#B91C1C] flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform"
        >
          <Square className="size-5 fill-white text-white" />
          HENTIKAN LATIHAN // SELESAI
        </Button>
      </div>
    </AppLayout>
  );
}
