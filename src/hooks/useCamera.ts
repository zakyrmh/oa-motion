import { useState, useEffect, useRef, useCallback } from 'react';

interface UseCameraOptions {
  facingMode?: 'user' | 'environment';
  autoStart?: boolean;
}

export function useCamera(options: UseCameraOptions = {}) {
  const { facingMode = 'user', autoStart = true } = options;
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>(facingMode);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Perangkat tidak mendukung akses kamera browser.');
      setIsCameraActive(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: currentFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
        };
      }
      setCameraError(null);
      setIsCameraActive(true);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Izin kamera ditolak atau kamera tidak ditemukan.';
      setCameraError(errorMsg);
      setIsCameraActive(false);
    }
  }, [currentFacingMode]);

  const toggleFacingMode = useCallback(() => {
    setCurrentFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const currentVideoEl = videoRef.current;

    async function initCamera() {
      if (!autoStart) return;

      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        if (!isCancelled) {
          setCameraError('Perangkat tidak mendukung akses kamera browser.');
          setIsCameraActive(false);
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: currentFacingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (currentVideoEl) {
          currentVideoEl.srcObject = stream;
          currentVideoEl.onloadedmetadata = () => {
            currentVideoEl?.play().catch(() => {});
          };
        }
        setCameraError(null);
        setIsCameraActive(true);
      } catch (err: unknown) {
        if (!isCancelled) {
          const errorMsg = err instanceof Error ? err.message : 'Izin kamera ditolak atau kamera tidak ditemukan.';
          setCameraError(errorMsg);
          setIsCameraActive(false);
        }
      }
    }

    initCamera();

    return () => {
      isCancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (currentVideoEl) {
        currentVideoEl.srcObject = null;
      }
    };
  }, [autoStart, currentFacingMode]);

  return {
    videoRef,
    isCameraActive,
    cameraError,
    startCamera,
    stopCamera,
    toggleFacingMode,
    facingMode: currentFacingMode,
  };
}
