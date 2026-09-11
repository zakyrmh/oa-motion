import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let poseLandmarker: PoseLandmarker | null = null;
let isInitializing = false;

/**
 * Inisialisasi Google MediaPipe Pose Landmarker secara asinkron.
 * Mengunduh aset WASM dan model secara dinamis menggunakan CDN untuk menghemat ukuran bundle.
 */
export async function initializePoseLandmarker(): Promise<PoseLandmarker> {
  if (poseLandmarker) return poseLandmarker;

  if (isInitializing) {
    // Menunggu jika proses inisialisasi lain sedang berjalan
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (poseLandmarker) return poseLandmarker;
  }

  isInitializing = true;
  try {
    // Mengambil WASM Fileset dari CDN jsDelivr
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm'
    );

    // Membuat instance PoseLandmarker dengan model Lite untuk performa tinggi di Edge AI
    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.65,
      minPosePresenceConfidence: 0.65,
      minTrackingConfidence: 0.65,
    });

    return poseLandmarker;
  } catch (error) {
    console.error('Gagal menginisialisasi MediaPipe Pose Landmarker:', error);
    throw error;
  } finally {
    isInitializing = false;
  }
}

/**
 * Mendapatkan instance PoseLandmarker aktif.
 * Mengembalikan null jika belum diinisialisasi.
 */
export function getPoseLandmarker(): PoseLandmarker | null {
  return poseLandmarker;
}

/**
 * Melakukan deteksi pose dari frame video webcam aktif.
 * @param video Element video webcam HTML.
 * @param timestamp Timestamp frame aktif (dalam milidetik).
 */
export function detectPose(video: HTMLVideoElement, timestamp: number) {
  if (!poseLandmarker) {
    throw new Error('PoseLandmarker belum diinisialisasi. Panggil initializePoseLandmarker() terlebih dahulu.');
  }
  return poseLandmarker.detectForVideo(video, timestamp);
}
