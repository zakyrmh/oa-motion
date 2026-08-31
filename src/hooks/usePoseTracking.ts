import { useEffect, useState, useRef } from 'react';
import type { RefObject } from 'react';
import type { PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import { initializePoseLandmarker, detectPose } from '@/engine/kinematics/poseDetector';

export interface UsePoseTrackingOptions {
  onResults: (results: PoseLandmarkerResult) => void;
  enabled?: boolean;
}

/**
 * Custom hook untuk mengelola loop pelacakan pose tubuh menggunakan MediaPipe.
 * @param videoRef RefObject yang menunjuk ke elemen HTMLVideoElement webcam.
 * @param options Opsi untuk pelacakan pose termasuk callback onResults.
 */
export function usePoseTracking(
  videoRef: RefObject<HTMLVideoElement | null>,
  options: UsePoseTrackingOptions
) {
  const { onResults, enabled = true } = options;
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  // Inisialisasi model MediaPipe sekali saat di-mount
  useEffect(() => {
    let isMounted = true;

    async function loadModel() {
      try {
        setIsLoading(true);
        setError(null);
        await initializePoseLandmarker();
        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Gagal mengunduh atau memuat model MediaPipe WASM.'
          );
          setIsLoading(false);
        }
      }
    }

    loadModel();

    return () => {
      isMounted = false;
    };
  }, []);

  // Mengelola loop frame deteksi pose
  useEffect(() => {
    // Jalankan loop hanya jika diaktifkan, model telah termuat, dan tidak ada error
    if (!enabled || isLoading || error) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    const processFrame = () => {
      // Pastikan frame video siap diproses (HAVE_CURRENT_DATA ke atas)
      if (video.readyState >= 2) {
        const currentTime = video.currentTime;
        // Hanya proses frame baru jika waktu pemutaran video berubah
        if (currentTime !== lastVideoTimeRef.current) {
          try {
            const timestamp = performance.now();
            const result = detectPose(video, timestamp);
            onResults(result);
            lastVideoTimeRef.current = currentTime;
          } catch (err) {
            console.error('Gagal memproses frame deteksi pose:', err);
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [enabled, isLoading, error, videoRef, onResults]);

  return {
    isLoading,
    error,
  };
}
