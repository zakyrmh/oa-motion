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
import { calculateAnkleAngle, calculateKneeAngle } from '@/engine/kinematics/angleCalculator';
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
  const [liveKneeAngle, setLiveKneeAngle] = useState<number | null>(null);
  const [liveAnkleAngle, setLiveAnkleAngle] = useState<number | null>(null);
  const [lastRecording, setLastRecording] = useState<ReferenceMovement | null>(null);
  const [statusMessage, setStatusMessage] = useState('Siapkan satu repetisi gerakan di depan kamera.');
  const samplesRef = useRef<number[]>([]);
  const recordingStartedAtRef = useRef(0);
  const kneeFilterRef = useRef(new EMAFilter(0.25));
  const ankleFilterRef = useRef(new EMAFilter(0.25));
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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

  const handlePoseResults = useCallback((frame: SmoothedPoseFrame) => {
    const hipIndex = 23;
    const kneeIndex = 25;
    const ankleIndex = 27;
    const footIndex = 31;
    const video = videoRef.current;
    // imageLandmarks dari MediaPipe dinormalisasi 0-1 secara TERPISAH untuk x
    // dan y. Karena video 16:9 (mis. 1280x720), 1 unit-x != 1 unit-y secara
    // fisik. Menghitung sudut langsung dari nilai ternormalisasi akan
    // mendistorsi hasil tergantung orientasi kaki di frame. Maka di sini
    // dikonversi dulu ke ruang piksel asli (isotropik) sebelum dipakai.
    const width = video?.videoWidth || 1;
    const height = video?.videoHeight || 1;
    const toPixelSpace = (landmark: typeof frame.imageLandmarks[number] | undefined) =>
      landmark ? { x: landmark.x * width, y: landmark.y * height, visibility: landmark.visibility } : undefined;

    const hip = toPixelSpace(frame.imageLandmarks[hipIndex]);
    const knee = toPixelSpace(frame.imageLandmarks[kneeIndex]);
    const ankle = toPixelSpace(frame.imageLandmarks[ankleIndex]);
    const foot = toPixelSpace(frame.imageLandmarks[footIndex]);
    if (!hip || !knee || !ankle || !foot) return;

    // calculateKneeAngle sudah menangani: (a) validasi visibility hip/ankle,
    // (b) estimasi posisi lutut saat oklusi memakai kalibrasi panjang tungkai.
    const rawKneeAngle = calculateKneeAngle(hip, knee, ankle, 'left');
    const rawAnkleAngle = calculateAnkleAngle(knee, ankle, foot);

    // Kalau lutut gagal terdeteksi dengan valid pada frame ini, jangan timpa
    // dengan nilai 0 — pertahankan angka terakhir yang valid di layar, dan
    // jangan ikut memasukkan sampel yang salah ke rekaman.
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

    if (!isRecording) return;
    // Hanya rekam sampel saat kedua sudut valid pada frame ini, supaya
    // deretan waktu (angleTimeSeries) tidak tercemar 0°/nilai basi.
    if (rawKneeAngle !== null && filteredKnee !== null) {
      samplesRef.current.push(filteredKnee);
      setSampleCount(samplesRef.current.length);
    }
    setElapsedMs(performance.now() - recordingStartedAtRef.current);
  }, [drawOverlay, isRecording, videoRef]);

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
    kneeFilterRef.current.reset();
    ankleFilterRef.current.reset();
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
          <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-5"><div className="rounded-xl bg-white p-3"><span className="block font-mono text-[10px] font-bold text-[#777]">LUTUT</span><strong className="font-mono text-xl">{liveKneeAngle === null ? '--' : `${Math.round(liveKneeAngle)}°`}</strong></div><div className="rounded-xl bg-white p-3"><span className="block font-mono text-[10px] font-bold text-[#777]">ANKLE</span><strong className="font-mono text-xl">{liveAnkleAngle === null ? '--' : `${Math.round(liveAnkleAngle)}°`}</strong></div><div className="rounded-xl bg-white p-3"><span className="block font-mono text-[10px] font-bold text-[#777]">SAMPEL</span><strong className="font-mono text-xl">{sampleCount}</strong></div><div className="rounded-xl bg-white p-3"><span className="block font-mono text-[10px] font-bold text-[#777]">DURASI</span><strong className="font-mono text-xl">{(elapsedMs / 1000).toFixed(1)}s</strong></div><div className="rounded-xl bg-white p-3"><span className="block font-mono text-[10px] font-bold text-[#777]">STATUS</span><strong className="font-mono text-xl">{lastRecording ? 'SIAP' : isRecording ? 'LIVE' : '-'}</strong></div></div>
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