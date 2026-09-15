import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Download, Play, RotateCcw, Save, Square, Video, Timer, CheckCircle2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { MovementType, SmoothedPoseFrame } from '@/types/kinematics';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AppLayout } from '@/components/layouts/AppLayout';
import { useCamera } from '@/hooks/useCamera';
import { usePoseTracking } from '@/hooks/usePoseTracking';
import { useAudioCoach } from '@/hooks/useAudioCoach';
import { calculateAnkleAngle, calculateKneeAngle } from '@/engine/kinematics/angleCalculator';
import { EMAFilter } from '@/engine/kinematics/emaFilter';
import { saveReferenceMovement } from '@/engine/kinematics/referenceStorage';
import { getReferenceRole } from '@/engine/kinematics/referenceAccess';
import type { ReferenceMovement } from '@/types/kinematics';

const MINIMUM_SAMPLES = 25;

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function createReferenceMovement(
  type: MovementType,
  name: string,
  samples: number[],
  durationMs: number
): ReferenceMovement {
  const peakFlexion = type === 'squat' ? Math.max(...samples) : Math.min(...samples);
  const peakFlexionIndex = samples.indexOf(peakFlexion);
  return {
    id: `recorded_${type}_${Date.now()}`,
    type,
    name,
    description: `Data gerakan referensi direkam secara lokal pada ${new Date().toLocaleDateString('id-ID')}.`,
    samplingRateHz: Math.round((samples.length / Math.max(durationMs / 1000, 0.1)) * 10) / 10,
    totalDurationSeconds: round(durationMs / 1000),
    angleTimeSeries: samples.map(round),
    keyPhaseIndices: {
      flexionStart: 0,
      peakFlexion: Math.max(0, peakFlexionIndex),
      extensionComplete: samples.length - 1,
    },
  };
}

export default function ReferenceRecorder() {
  const navigate = useNavigate();
  const referenceRole = getReferenceRole();
  const { speak, playSuccess, playTick, stopSpeaking } = useAudioCoach(false);

  const [movementType, setMovementType] = useState<MovementType>('squat');
  const [movementName, setMovementName] = useState('Squat Referensi Instruktur');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [sampleCount, setSampleCount] = useState(0);
  const [liveKneeAngle, setLiveKneeAngle] = useState<number | null>(null);
  const [liveAnkleAngle, setLiveAnkleAngle] = useState<number | null>(null);
  const [lastRecording, setLastRecording] = useState<ReferenceMovement | null>(null);
  const [statusMessage, setStatusMessage] = useState('Posisikan tubuh di depan kamera, lalu tekan Mulai Rekam.');

  const samplesRef = useRef<number[]>([]);
  const recordingStartedAtRef = useRef(0);
  const isRecordingRef = useRef(false);
  const kneeFilterRef = useRef(new EMAFilter(0.25));
  const ankleFilterRef = useRef(new EMAFilter(0.25));
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Auto-stop repetition cycle refs
  const cycleStartedRef = useRef(false);
  const reachedStandingRef = useRef(false);
  const peakDepthRef = useRef(0);

  const {
    videoRef,
    isCameraActive,
    cameraError,
    startCamera,
    stopCamera,
    toggleFacingMode,
  } = useCamera({ facingMode: 'user', autoStart: true });

  const drawOverlay = useCallback((frame: SmoothedPoseFrame, kneeAngle: number, ankleAngle: number) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || frame.imageLandmarks.length < 33) return;
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    }
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    const point = (index: number) => ({
      x: (1 - frame.imageLandmarks[index].x) * canvas.width,
      y: frame.imageLandmarks[index].y * canvas.height,
    });
    const hip = point(23);
    const knee = point(25);
    const ankle = point(27);
    const foot = point(31);
    context.beginPath();
    context.moveTo(hip.x, hip.y);
    context.lineTo(knee.x, knee.y);
    context.lineTo(ankle.x, ankle.y);
    context.strokeStyle = '#d1ffca';
    context.lineWidth = 8;
    context.lineCap = 'round';
    context.stroke();
    context.beginPath();
    context.moveTo(ankle.x, ankle.y);
    context.lineTo(foot.x, foot.y);
    context.strokeStyle = '#ffffff';
    context.lineWidth = 5;
    context.stroke();

    const drawNode = (node: { x: number; y: number }, radius: number, fill: string) => {
      context.beginPath();
      context.arc(node.x, node.y, radius, 0, Math.PI * 2);
      context.fillStyle = fill;
      context.fill();
      context.lineWidth = 2;
      context.strokeStyle = '#000000';
      context.stroke();
    };

    drawNode(hip, 8, '#ffffff');
    drawNode(ankle, 10, '#ffffff');
    drawNode(foot, 8, '#fff100');
    drawNode(knee, 14, '#d1ffca');

    const drawTag = (node: { x: number; y: number }, text: string, color: string) => {
      context.font = 'bold 14px monospace';
      const tagWidth = context.measureText(text).width + 18;
      const tagHeight = 26;
      const tagX = Math.min(canvas.width - tagWidth - 8, Math.max(8, node.x + 16));
      const tagY = Math.min(canvas.height - tagHeight - 8, Math.max(8, node.y - 14));
      context.fillStyle = '#000000';
      context.beginPath();
      context.roundRect(tagX, tagY, tagWidth, tagHeight, 13);
      context.fill();
      context.lineWidth = 2;
      context.strokeStyle = color;
      context.stroke();
      context.fillStyle = color;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, tagX + tagWidth / 2, tagY + tagHeight / 2);
    };

    drawTag(knee, `LUTUT ${Math.round(kneeAngle)}°`, '#d1ffca');
    drawTag(ankle, `ANKLE ${Math.round(ankleAngle)}°`, '#fff100');
  }, [videoRef]);

  const stopRecording = useCallback((isAuto: boolean = false) => {
    isRecordingRef.current = false;
    setIsRecording(false);
    const durationMs = performance.now() - recordingStartedAtRef.current;
    if (samplesRef.current.length < MINIMUM_SAMPLES) {
      setStatusMessage(`Rekaman terlalu singkat (${samplesRef.current.length} sampel). Ulangi kembali.`);
      playTick();
      return;
    }
    const reference = createReferenceMovement(movementType, movementName.trim() || 'Gerakan Referensi', samplesRef.current, durationMs);
    setLastRecording(reference);
    playSuccess();
    if (isAuto) {
      speak('Satu repetisi selesai. Rekaman berhasil disimpan.');
      setStatusMessage('1 repetisi selesai & terekam otomatis. Tekan "Simpan untuk Tracking".');
    } else {
      setStatusMessage('Rekaman dihentikan. Tekan "Simpan untuk Tracking".');
    }
  }, [movementName, movementType, playSuccess, playTick, speak]);

  const handlePoseResults = useCallback((frame: SmoothedPoseFrame) => {
    const hipIndex = 23;
    const kneeIndex = 25;
    const ankleIndex = 27;
    const footIndex = 31;
    const video = videoRef.current;
    const width = video?.videoWidth || 1;
    const height = video?.videoHeight || 1;
    const toPixelSpace = (landmark: typeof frame.imageLandmarks[number] | undefined) =>
      landmark ? { x: landmark.x * width, y: landmark.y * height, visibility: landmark.visibility } : undefined;

    const hip = toPixelSpace(frame.imageLandmarks[hipIndex]);
    const knee = toPixelSpace(frame.imageLandmarks[kneeIndex]);
    const ankle = toPixelSpace(frame.imageLandmarks[ankleIndex]);
    const foot = toPixelSpace(frame.imageLandmarks[footIndex]);
    if (!hip || !knee || !ankle || !foot) return;

    const rawKneeAngle = calculateKneeAngle(hip, knee, ankle, 'left');
    const rawAnkleAngle = calculateAnkleAngle(knee, ankle, foot);

    let filteredKnee = kneeFilterRef.current.get();
    if (rawKneeAngle !== null) {
      filteredKnee = kneeFilterRef.current.filter(rawKneeAngle);
      setLiveKneeAngle(filteredKnee);
    }

    let filteredAnkle = ankleFilterRef.current.get();
    if (rawAnkleAngle !== null) {
      filteredAnkle = ankleFilterRef.current.filter(rawAnkleAngle);
      setLiveAnkleAngle(filteredAnkle);
    }

    if (filteredKnee !== null && filteredAnkle !== null) {
      drawOverlay(frame, filteredKnee, filteredAnkle);
    }

    // Perekaman aktif
    if (!isRecordingRef.current) return;
    if (rawKneeAngle !== null && filteredKnee !== null) {
      samplesRef.current.push(filteredKnee);
      setSampleCount(samplesRef.current.length);

      // Logika Deteksi 1 Repetisi Penuh Otomatis (Auto-Stop)
      if (movementType === 'squat') {
        // SQUAT: Berdiri (<=20°) -> Menekuk (>=25°) -> Puncak (>=30°) -> Kembali berdiri (<=20°)
        if (!cycleStartedRef.current && filteredKnee >= 25) {
          cycleStartedRef.current = true;
          peakDepthRef.current = filteredKnee;
          setStatusMessage('Gerakan terdeteksi: Menekuk lutut... Lanjutkan hingga titik optimal lalu dorong naik.');
        } else if (cycleStartedRef.current) {
          peakDepthRef.current = Math.max(peakDepthRef.current, filteredKnee);
          // Jika sudah mencapai kedalaman minimal 30° dan kembali berdiri tegak (<=20°) serta sampel cukup
          if (peakDepthRef.current >= 30 && filteredKnee <= 20 && samplesRef.current.length >= MINIMUM_SAMPLES) {
            stopRecording(true);
          }
        }
      } else {
        // SIT-TO-STAND: Duduk (>=60°) -> Berdiri (<=20°) -> Duduk kembali (>=60°)
        if (!cycleStartedRef.current && filteredKnee >= 60) {
          cycleStartedRef.current = true;
          setStatusMessage('Posisi duduk terdeteksi. Berdiri perlahan lalu duduk kembali.');
        } else if (cycleStartedRef.current) {
          if (filteredKnee <= 20) {
            reachedStandingRef.current = true;
            setStatusMessage('Berdiri tercapai! Sekarang duduk kembali dengan terkontrol.');
          }
          if (reachedStandingRef.current && filteredKnee >= 60 && samplesRef.current.length >= MINIMUM_SAMPLES) {
            stopRecording(true);
          }
        }
      }
    }
    setElapsedMs(performance.now() - recordingStartedAtRef.current);
  }, [drawOverlay, movementType, stopRecording, videoRef]);

  const { isLoading: isModelLoading, error: modelError } = usePoseTracking(videoRef, {
    onResults: handlePoseResults,
    enabled: isCameraActive,
  });

  const startActualRecording = useCallback(() => {
    samplesRef.current = [];
    cycleStartedRef.current = false;
    reachedStandingRef.current = false;
    peakDepthRef.current = 0;
    kneeFilterRef.current.reset();
    ankleFilterRef.current.reset();
    recordingStartedAtRef.current = performance.now();
    isRecordingRef.current = true;
    setIsRecording(true);
    setElapsedMs(0);
    setSampleCount(0);
    setLastRecording(null);
    setStatusMessage('Merekam: Lakukan tepat 1 repetisi penuh dengan tempo stabil.');
  }, []);

  // Handle 5-second countdown timer effect
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => {
        const next = countdown - 1;
        setCountdown(next);
        if (next > 0) {
          playTick();
        } else {
          startActualRecording();
          playSuccess();
          speak('Mulai gerakan!');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, playSuccess, playTick, speak, startActualRecording]);

  useEffect(() => {
    if (!isRecording) return;
    const timer = window.setInterval(() => {
      setElapsedMs(performance.now() - recordingStartedAtRef.current);
    }, 100);
    return () => window.clearInterval(timer);
  }, [isRecording]);

  const handleStartWithCountdown = () => {
    setLastRecording(null);
    setCountdown(5);
    setStatusMessage('Bersiap di depan kamera... Rekaman dimulai dalam 5 detik.');
    speak('Bersiap di depan kamera.');
  };

  const handleCancelCountdown = () => {
    setCountdown(null);
    stopSpeaking();
    setStatusMessage('Perekaman dibatalkan. Siapkan posisi Anda dan klik Mulai Rekam.');
  };

  const saveRecording = async () => {
    if (!lastRecording) return;
    try {
      await saveReferenceMovement(lastRecording);
      setStatusMessage(`Data "${lastRecording.name}" tersimpan di perangkat dan langsung aktif di Tracking!`);
      playSuccess();
    } catch (error: unknown) {
      setStatusMessage(error instanceof Error ? error.message : 'Data referensi gagal disimpan.');
    }
  };

  const downloadRecording = () => {
    if (!lastRecording) return;
    const blob = new Blob([JSON.stringify(lastRecording, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${lastRecording.type}-reference-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout variant="dark" className="relative overflow-hidden">
      <header className="relative z-20 flex items-center justify-between gap-3 bg-black/80 p-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="size-12 rounded-full border border-white/20 text-white shadow-none" aria-label="Kembali ke profil">
          <ArrowLeft className="size-6" />
        </Button>
        <div className="text-center">
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#d1ffca]">{referenceRole === 'sports_expert' ? 'AHLI OLAHRAGA' : 'ADMIN'} // GOLDEN DATA</p>
          <h1 className="text-lg font-black uppercase text-white">REKAM GERAKAN REFERENSI</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleFacingMode} className="size-12 rounded-full border border-white/20 text-white shadow-none" aria-label="Ganti kamera"><Video className="size-5" /></Button>
      </header>

      <main className="relative z-10 flex flex-1 flex-col gap-4 p-4">
        <Card className="relative aspect-video min-h-[280px] overflow-hidden rounded-3xl border-2 border-white/20 bg-[#111111] p-0 shadow-none">
          {isCameraActive ? (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover scale-x-[-1]" />
              <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
            </>
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm font-semibold text-[#979797]">
              {cameraError || modelError || 'Menyiapkan kamera dan model pose di perangkat.'}
              {cameraError && <Button onClick={startCamera} className="ml-3 bg-[#d1ffca] text-black">Coba lagi</Button>}
            </div>
          )}

          {/* Model Loading State */}
          {isModelLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 font-mono text-xs font-bold uppercase text-[#d1ffca]">
              Memuat MediaPipe...
            </div>
          )}

          {/* Countdown Overlay (5, 4, 3, 2, 1) */}
          {countdown !== null && countdown > 0 && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm gap-3">
              <span className="font-mono text-xs uppercase font-bold tracking-widest text-[#d1ffca] animate-pulse">
                BERSIAP DI DEPAN KAMERA...
              </span>
              <div className="size-24 rounded-full border-4 border-[#d1ffca] bg-black/80 flex items-center justify-center shadow-[0_0_30px_rgba(209,255,202,0.6)] animate-scale">
                <span className="font-mono text-5xl font-black text-[#d1ffca]">
                  {countdown}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelCountdown}
                className="mt-2 rounded-full border-white/30 text-white hover:bg-white/10"
              >
                <X className="size-4 mr-1.5" /> Batal
              </Button>
            </div>
          )}

          {/* Live Status Badge */}
          <Badge className={`absolute left-4 top-4 rounded-full border-none px-3 py-1 font-mono text-xs font-bold shadow-none ${isRecording ? 'bg-[#EF4444] text-white animate-pulse' : countdown !== null ? 'bg-[#fff100] text-black' : 'bg-[#d1ffca] text-black'}`}>
            {isRecording ? '🔴 MEREKAM (AUTO-STOP AKTIF)' : countdown !== null ? `⏱️ BERSIAP: ${countdown}s` : 'PREVIEW KAMERA'}
          </Badge>
        </Card>

        <Card className="flex flex-col gap-4 rounded-3xl border-2 border-white/20 bg-[#f3f3f3] p-5 text-black shadow-none">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-bold uppercase">
              Jenis gerakan
              <select value={movementType} onChange={(event) => setMovementType(event.target.value as MovementType)} disabled={isRecording || countdown !== null} className="h-12 rounded-xl border-2 border-black bg-white px-3 text-base normal-case outline-none">
                <option value="squat">Squat (Berdiri ➔ Menekuk ➔ Berdiri)</option>
                <option value="sit_to_stand">Sit-to-Stand (Duduk ➔ Berdiri ➔ Duduk)</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-bold uppercase">
              Nama referensi
              <input value={movementName} onChange={(event) => setMovementName(event.target.value)} disabled={isRecording || countdown !== null} className="h-12 rounded-xl border-2 border-black bg-white px-3 text-base normal-case outline-none" />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-5">
            <div className="rounded-xl bg-white p-3">
              <span className="block font-mono text-[10px] font-bold text-[#777]">LUTUT</span>
              <strong className="font-mono text-xl">{liveKneeAngle === null ? '--' : `${Math.round(liveKneeAngle)}°`}</strong>
            </div>
            <div className="rounded-xl bg-white p-3">
              <span className="block font-mono text-[10px] font-bold text-[#777]">ANKLE</span>
              <strong className="font-mono text-xl">{liveAnkleAngle === null ? '--' : `${Math.round(liveAnkleAngle)}°`}</strong>
            </div>
            <div className="rounded-xl bg-white p-3">
              <span className="block font-mono text-[10px] font-bold text-[#777]">SAMPEL</span>
              <strong className="font-mono text-xl">{sampleCount}</strong>
            </div>
            <div className="rounded-xl bg-white p-3">
              <span className="block font-mono text-[10px] font-bold text-[#777]">DURASI</span>
              <strong className="font-mono text-xl">{(elapsedMs / 1000).toFixed(1)}s</strong>
            </div>
            <div className="rounded-xl bg-white p-3">
              <span className="block font-mono text-[10px] font-bold text-[#777]">STATUS</span>
              <strong className="font-mono text-xl">{lastRecording ? 'SIAP' : isRecording ? 'MEREKAM' : countdown !== null ? 'COUNTDOWN' : '-'}</strong>
            </div>
          </div>

          {/* Status Message Card */}
          <div className="rounded-2xl border-2 border-black bg-white p-3.5 flex items-center gap-3">
            <Timer className="size-5 shrink-0 text-[#000000]" />
            <p className="text-xs sm:text-sm font-bold text-[#000000]">{statusMessage}</p>
          </div>

          {/* Primary Action Buttons */}
          {!isRecording && countdown === null ? (
            <Button
              onClick={handleStartWithCountdown}
              disabled={!isCameraActive || isModelLoading}
              className="h-14 rounded-2xl bg-black text-base font-black uppercase text-white shadow-none hover:bg-[#222222]"
            >
              <Play className="mr-2 size-5 text-[#d1ffca]" /> Mulai Rekam (Timer 5 Detik)
            </Button>
          ) : isRecording ? (
            <Button
              onClick={() => stopRecording(false)}
              className="h-14 rounded-2xl bg-[#EF4444] text-base font-black uppercase text-white shadow-none hover:bg-[#dc2626]"
            >
              <Square className="mr-2 size-5 fill-white" /> Hentikan Rekaman Manual
            </Button>
          ) : (
            <Button
              onClick={handleCancelCountdown}
              variant="outline"
              className="h-14 rounded-2xl border-2 border-black bg-white text-base font-black uppercase text-black shadow-none"
            >
              <X className="mr-2 size-5" /> Batalkan Timer
            </Button>
          )}

          {lastRecording && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Button onClick={saveRecording} className="h-14 rounded-2xl bg-[#d1ffca] hover:bg-[#bbf6b4] font-black text-base uppercase text-black shadow-none flex items-center justify-center gap-2">
                <Save className="size-5" /> Simpan untuk Tracking
              </Button>
              <Button onClick={downloadRecording} variant="outline" className="h-14 rounded-2xl border-2 border-black bg-white font-bold uppercase text-black shadow-none flex items-center justify-center gap-2">
                <Download className="size-5" /> Unduh File JSON
              </Button>
            </div>
          )}

          {lastRecording && (
            <div className="p-3 bg-[#d1ffca]/30 border border-black rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="size-4 text-black shrink-0" />
              <span>Rekaman 1 repetisi tersimpan di memori. Klik tombol hijau untuk mengaktifkannya di Tracking.</span>
            </div>
          )}

          <Button onClick={handleStartWithCountdown} variant="ghost" disabled={isRecording || countdown !== null} className="h-10 font-bold uppercase text-[#444444]">
            <RotateCcw className="mr-2 size-4" /> Rekam Ulang
          </Button>
        </Card>
      </main>
      <footer className="relative z-10 p-4 text-center font-mono text-[11px] uppercase tracking-wide text-[#979797]">Diproses lokal di browser // tidak ada video yang dikirim ke server</footer>
      <button type="button" onClick={stopCamera} className="sr-only">Hentikan kamera</button>
    </AppLayout>
  );
}