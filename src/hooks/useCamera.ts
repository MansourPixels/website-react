import { useCallback, useEffect, useRef, useState } from "react";

type CameraStatus = "idle" | "loading" | "ready" | "error";

interface UseCameraOptions {
  autoStart?: boolean;
}

const ERROR_MESSAGES: Record<string, string> = {
  NotAllowedError:
    "Permissão negada. Autorize o acesso à câmera nas configurações do navegador.",
  NotFoundError: "Nenhuma câmera foi encontrada neste dispositivo.",
  NotReadableError:
    "Não foi possível iniciar a câmera. Ela pode estar em uso por outro aplicativo.",
  OverconstrainedError: "Nenhuma câmera compatível foi encontrada.",
  SecurityError: "O acesso à câmera exige uma conexão segura (HTTPS).",
};

function getErrorMessage(cause: unknown) {
  if (cause instanceof DOMException && ERROR_MESSAGES[cause.name]) {
    return ERROR_MESSAGES[cause.name];
  }

  return "Não foi possível acessar a câmera.";
}

function stopStream(stream: MediaStream | null) {
  for (const track of stream?.getTracks() ?? []) {
    track.stop();
  }
}

export function useCamera({ autoStart = true }: UseCameraOptions = {}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<CameraStatus>(
    autoStart ? "loading" : "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [isFlashSupported, setIsFlashSupported] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [attempt, setAttempt] = useState(autoStart ? 1 : 0);

  useEffect(() => {
    if (attempt === 0) return;

    let isCancelled = false;

    async function startCamera() {
      setStatus("loading");
      setError(null);
      setIsFlashOn(false);
      setIsFlashSupported(false);

      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("error");
        setError("Este navegador não oferece suporte ao acesso à câmera.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });

        if (isCancelled) {
          stopStream(stream);
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        const [track] = stream.getVideoTracks();
        setIsFlashSupported(Boolean(track?.getCapabilities?.().torch));
        setStatus("ready");
      } catch (cause) {
        if (isCancelled) return;

        setStatus("error");
        setError(getErrorMessage(cause));
      }
    }

    startCamera();

    return () => {
      isCancelled = true;
      stopStream(streamRef.current);
      streamRef.current = null;
    };
  }, [attempt]);

  useEffect(() => {
    if (status !== "ready") return;
    if (videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [status]);

  const toggleFlash = useCallback(async () => {
    const [track] = streamRef.current?.getVideoTracks() ?? [];
    if (!track) return;

    const nextValue = !isFlashOn;

    try {
      await track.applyConstraints({ advanced: [{ torch: nextValue }] });
      setIsFlashOn(nextValue);
    } catch {
      setIsFlashSupported(false);
    }
  }, [isFlashOn]);

  const capturePhoto = useCallback(async () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return null;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) return null;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.92);
    });
  }, []);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);
  const start = retry;

  const stop = useCallback(() => {
    stopStream(streamRef.current);
    streamRef.current = null;

    if (videoRef.current) videoRef.current.srcObject = null;

    setAttempt(0);
    setStatus("idle");
    setError(null);
    setIsFlashOn(false);
    setIsFlashSupported(false);
  }, []);

  return {
    videoRef,
    status,
    error,
    isFlashSupported,
    isFlashOn,
    toggleFlash,
    capturePhoto,
    retry,
    start,
    stop,
  };
}
