import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Download, Play, RotateCcw, Save, Square, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { MovementType, SmoothedPoseFrame } from '@/types/kinematics';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AppLayout } from '@/components/layouts/AppLayout';
import { useCamera } from '@/hooks/useCamera';
import { usePoseTracking } from '@/hooks/usePoseTracking';
import { calculateKneeAngle3D } from '@/engine/kinematics/angleCalculator';
import { EMAFilter } from '@/engine/kinematics/emaFilter';
import { saveReferenceMovement } from '@/engine/kinematics/referenceStorage';
import { getReferenceRole, hasReferenceRecorderAccess } from '@/engine/kinematics/referenceAccess';
import type { ReferenceMovement } from '@/types/kinematics';

const MINIMUM_SAMPLES = 30;

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function createReferenceMovement(
  type: MovementType,
  name: string,
  samples: number[],
  durationMs: number
): ReferenceMovement {
  const peakFlexion = Math.min(...samples);
  const peakFlexionIndex = samples.indexOf(peakFlexion);
  return {
    id: `recorded_${type}_${Date.now()}`,
    type,
    name,
    description: `Data gerakan referensi direkam secara lokal pada ${new Date().toLocaleDateString('id-ID')}.`,
    samplingRateHz: samples.length / Math.max(durationMs / 1000, 0.1),
    totalDurationSeconds: round(durationMs / 1000),
    angleTimeSeries: samples.map(round),
    keyPhaseIndices: {
      flexionStart: 0,
      peakFlexion: peakFlexionIndex,
      extensionComplete: samples.length - 1,
    },
  };
}

export default function ReferenceRecorder() {
  const navigate = useNavigate();
  const referenceRole = getReferenceRole();
  const [movementType, setMovementType] = useState<MovementType>('squat');
  const [movementName, setMovementName] = useState('Squat Referensi Instruktur');
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [sampleCount, setSampleCount] = useState(0);
  const [lastRecording, setLastRecording] = useState<ReferenceMovement | null>(null);
  const [statusMessage, setStatusMessage] = useState('Siapkan satu repetisi gerakan di depan kamera.');
  const samplesRef = useRef<number[]>([]);
  const recordingStartedAtRef = useRef(0);
  const angleFilterRef = useRef(new EMAFilter(0.25));
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const {
    videoRef,
    isCameraActive,
    cameraError,
    startCamera,
    stopCamera,
    toggleFacingMode,
  } = useCamera({ facingMode: 'user', autoStart: true });

  const drawOverlay = useCallback((frame: SmoothedPoseFrame) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || frame.imageLandmarks.length < 33) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
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
    context.beginPath();
    context.moveTo(hip.x, hip.y);
    context.lineTo(knee.x, knee.y);
    context.lineTo(ankle.x, ankle.y);
    context.strokeStyle = '#d1ffca';
    context.lineWidth = 8;
    context.lineCap = 'round';
    context.stroke();
    context.fillStyle = '#fff100';
    context.strokeStyle = '#000000';
    context.lineWidth = 3;
    context.beginPath();
    context.arc(knee.x, knee.y, 14, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }, [videoRef]);

  const handlePoseResults = useCallback((frame: SmoothedPoseFrame) => {
    drawOverlay(frame);
    if (!isRecording) return;
    const hipIndex = 23;
    const kneeIndex = 25;
    const ankleIndex = 27;
    const hip = frame.worldLandmarks[hipIndex];
    const knee = frame.worldLandmarks[kneeIndex];
    const ankle = frame.worldLandmarks[ankleIndex];
    if (!hip || !knee || !ankle) return;
    const angle = angleFilterRef.current.filter(calculateKneeAngle3D(hip, knee, ankle));
    samplesRef.current.push(angle);
    setSampleCount(samplesRef.current.length);
    setElapsedMs(performance.now() - recordingStartedAtRef.current);
  }, [drawOverlay, isRecording]);

  const { isLoading: isModelLoading, error: modelError } = usePoseTracking(videoRef, {
    onResults: handlePoseResults,
    enabled: isCameraActive,
  });

  useEffect(() => {
    if (!isRecording) return;
    const timer = window.setInterval(() => {
      setElapsedMs(performance.now() - recordingStartedAtRef.current);
    }, 100);
    return () => window.clearInterval(timer);
  }, [isRecording]);

  const startRecording = () => {
    samplesRef.current = [];
    angleFilterRef.current.reset();
    recordingStartedAtRef.current = performance.now();
    setElapsedMs(0);
    setSampleCount(0);
    setLastRecording(null);
    setStatusMessage('Merekam. Lakukan satu repetisi penuh dengan tempo alami.');
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
    const durationMs = performance.now() - recordingStartedAtRef.current;
    if (samplesRef.current.length < MINIMUM_SAMPLES) {
      setStatusMessage(`Rekaman terlalu singkat. Minimal ${MINIMUM_SAMPLES} sampel pose diperlukan.`);
      return;
    }
    const reference = createReferenceMovement(movementType, movementName.trim() || 'Gerakan Referensi', samplesRef.current, durationMs);
    setLastRecording(reference);
    setStatusMessage('Rekaman siap disimpan. Tinjau jumlah sampel sebelum menyimpan.');
  };

  const saveRecording = async () => {
    if (!lastRecording) return;
    try {
      await saveReferenceMovement(lastRecording);
      setStatusMessage(`Data ${lastRecording.name} tersimpan di perangkat dan akan dipakai Tracking.`);
    } catch (error: unknown) {
      setStatusMessage(error instanceof Error ? error.message : 'Data referensi gagal disimpan.');
    }
  };

  if (!hasReferenceRecorderAccess()) {
    return (
      <AppLayout variant="dark" className="flex items-center justify-center p-6">
        <Card className="max-w-lg rounded-3xl border-2 border-black bg-white p-6 text-black shadow-none">
          <h1 className="text-xl font-black uppercase">Akses perekam ditolak</h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-[#444444]">
            Pembuatan golden data hanya tersedia untuk admin atau ahli olahraga yang sudah diautentikasi oleh server.
          </p>
          <Button onClick={() => navigate('/')} className="mt-5 h-12 w-full rounded-2xl bg-black font-bold uppercase text-white shadow-none">Kembali</Button>
        </Card>
      </AppLayout>
    );
  }

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
        <div className="text-center"><p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#d1ffca]">{referenceRole === 'sports_expert' ? 'AHLI OLAHRAGA' : 'ADMIN'} // GOLDEN DATA</p><h1 className="text-lg font-black uppercase text-white">REKAM GERAKAN REFERENSI</h1></div>
        <Button variant="ghost" size="icon" onClick={toggleFacingMode} className="size-12 rounded-full border border-white/20 text-white shadow-none" aria-label="Ganti kamera"><Video className="size-5" /></Button>
      </header>

      <main className="relative z-10 flex flex-1 flex-col gap-4 p-4">
        <Card className="relative aspect-video min-h-[280px] overflow-hidden rounded-3xl border-2 border-white/20 bg-[#111111] p-0 shadow-none">
          {isCameraActive ? <><video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover scale-x-[-1]" /><canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full object-cover" /></> : <div className="flex h-full items-center justify-center p-6 text-center text-sm font-semibold text-[#979797]">{cameraError || modelError || 'Menyiapkan kamera dan model pose di perangkat.'}{cameraError && <Button onClick={startCamera} className="ml-3 bg-[#d1ffca] text-black">Coba lagi</Button>}</div>}
          {isModelLoading && <div className="absolute inset-0 flex items-center justify-center bg-black/70 font-mono text-xs font-bold uppercase text-[#d1ffca]">Memuat MediaPipe...</div>}
          <Badge className={`absolute left-4 top-4 rounded-full border-none px-3 py-1 font-mono text-xs font-bold shadow-none ${isRecording ? 'bg-[#EF4444] text-white' : 'bg-[#d1ffca] text-black'}`}>{isRecording ? 'REKAMAN AKTIF' : 'PREVIEW KAMERA'}</Badge>
        </Card>

        <Card className="flex flex-col gap-4 rounded-3xl border-2 border-white/20 bg-[#f3f3f3] p-5 text-black shadow-none">
          <div className="grid gap-3 sm:grid-cols-2"><label className="flex flex-col gap-2 text-sm font-bold uppercase">Jenis gerakan<select value={movementType} onChange={(event) => setMovementType(event.target.value as MovementType)} className="h-12 rounded-xl border-2 border-black bg-white px-3 text-base normal-case outline-none"><option value="sit_to_stand">Sit-to-Stand</option><option value="squat">Squat</option></select></label><label className="flex flex-col gap-2 text-sm font-bold uppercase">Nama referensi<input value={movementName} onChange={(event) => setMovementName(event.target.value)} className="h-12 rounded-xl border-2 border-black bg-white px-3 text-base normal-case outline-none" /></label></div>
          <div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-white p-3"><span className="block font-mono text-[10px] font-bold text-[#777]">SAMPEL</span><strong className="font-mono text-xl">{sampleCount}</strong></div><div className="rounded-xl bg-white p-3"><span className="block font-mono text-[10px] font-bold text-[#777]">DURASI</span><strong className="font-mono text-xl">{(elapsedMs / 1000).toFixed(1)}s</strong></div><div className="rounded-xl bg-white p-3"><span className="block font-mono text-[10px] font-bold text-[#777]">STATUS</span><strong className="font-mono text-xl">{lastRecording ? 'SIAP' : isRecording ? 'LIVE' : '-'}</strong></div></div>
          <p className="text-sm font-semibold text-[#444444]">{statusMessage}</p>
          {!isRecording ? <Button onClick={startRecording} disabled={!isCameraActive || isModelLoading} className="h-14 rounded-2xl bg-black text-base font-black uppercase text-white shadow-none"><Play className="mr-2 size-5 text-[#d1ffca]" /> Mulai rekam</Button> : <Button onClick={stopRecording} className="h-14 rounded-2xl bg-[#EF4444] text-base font-black uppercase text-white shadow-none"><Square className="mr-2 size-5 fill-white" /> Hentikan rekaman</Button>}
          {lastRecording && <div className="grid gap-3 sm:grid-cols-2"><Button onClick={saveRecording} className="h-12 rounded-2xl bg-[#d1ffca] font-bold uppercase text-black shadow-none"><Save className="mr-2 size-5" /> Simpan untuk tracking</Button><Button onClick={downloadRecording} variant="outline" className="h-12 rounded-2xl border-2 border-black bg-white font-bold uppercase text-black shadow-none"><Download className="mr-2 size-5" /> Unduh JSON</Button></div>}
          <Button onClick={startRecording} variant="ghost" className="h-10 font-bold uppercase text-[#444444]"><RotateCcw className="mr-2 size-4" /> Rekam ulang</Button>
        </Card>
      </main>
      <footer className="relative z-10 p-4 text-center font-mono text-[11px] uppercase tracking-wide text-[#979797]">Diproses lokal // tidak ada video yang disimpan atau dikirim</footer>
      <button type="button" onClick={stopCamera} className="sr-only">Hentikan kamera</button>
    </AppLayout>
  );
}
