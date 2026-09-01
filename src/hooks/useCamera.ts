import { useCallback, useEffect, useRef, useState } from "react";

type CameraStatus = "idle" | "loading" | "ready" | "error";

export interface ExposureRange {
  min: number;
  max: number;
  step: number;
}

export interface FocusPoint {
  x: number;
  y: number;
}

interface UseCameraOptions {
  autoStart?: boolean;
}

/**
 * `applyConstraints` substitui o conjunto inteiro de constraints da track em vez
 * de mesclar, então as capacidades que o app controla vivem aqui em partes
 * nomeadas e são sempre reaplicadas juntas. Cada parte vira um conjunto separado
 * dentro de `advanced`, que é aplicado em melhor esforço de forma independente —
 * assim uma capacidade ausente no aparelho não derruba as outras junto.
 *
 * Nunca acrescente `width`, `height` ou `frameRate` aqui: reaplicar resolução
 * renegocia a sessão de captura e trava a preview.
 */
interface TrackConstraintParts {
  torch?: MediaTrackConstraintSet;
  focus?: MediaTrackConstraintSet;
  exposure?: MediaTrackConstraintSet;
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pickMode(modes: string[] | undefined, preferred: string[]) {
  return preferred.find((mode) => modes?.includes(mode)) ?? null;
}

/**
 * O ponto de interesse não é declarado em capabilities pela spec do Image
 * Capture, só em constraints — quem responde por ele é o navegador, não o
 * aparelho. O Safari devolve `undefined` aqui, que é o que desliga o recurso lá.
 */
function supportsPointsOfInterest() {
  return Boolean(
    navigator.mediaDevices?.getSupportedConstraints?.().pointsOfInterest,
  );
}

function readExposureRange(
  capabilities: MediaTrackCapabilities | undefined,
): ExposureRange | null {
  const range = capabilities?.exposureCompensation;
  if (!range) return null;

  const { min, max, step } = range;
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return null;

  return {
    min,
    max,
    step: Number.isFinite(step) && step > 0 ? step : (max - min) / 100,
  };
}

/** Alinha o valor ao passo de EV do aparelho, evitando applies redundantes. */
export function snapExposure(value: number, range: ExposureRange) {
  const steps = Math.round((value - range.min) / range.step);
  const snapped = Number((range.min + steps * range.step).toFixed(4));

  return clamp(snapped, range.min, range.max);
}

export function useCamera({ autoStart = true }: UseCameraOptions = {}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const constraintsRef = useRef<TrackConstraintParts>({});
  const focusModeRef = useRef<string | null>(null);
  const exposureModeRef = useRef<string | null>(null);
  const exposureRangeRef = useRef<ExposureRange | null>(null);
  const exposureBaselineRef = useRef(0);
  const exposureValueRef = useRef(0);

  const [status, setStatus] = useState<CameraStatus>(
    autoStart ? "loading" : "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [isFlashSupported, setIsFlashSupported] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isTapFocusSupported, setIsTapFocusSupported] = useState(false);
  const [exposureRange, setExposureRange] = useState<ExposureRange | null>(null);
  const [exposureBaseline, setExposureBaseline] = useState(0);
  const [attempt, setAttempt] = useState(autoStart ? 1 : 0);

  const resetCapabilities = useCallback(() => {
    constraintsRef.current = {};
    focusModeRef.current = null;
    exposureModeRef.current = null;
    exposureRangeRef.current = null;
    exposureBaselineRef.current = 0;
    exposureValueRef.current = 0;

    setIsFlashOn(false);
    setIsFlashSupported(false);
    setIsTapFocusSupported(false);
    setExposureRange(null);
    setExposureBaseline(0);
  }, []);

  useEffect(() => {
    if (attempt === 0) return;

    let isCancelled = false;

    async function startCamera() {
      setStatus("loading");
      setError(null);
      resetCapabilities();

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
      constraintsRef.current = {};
    };
  }, [attempt, resetCapabilities]);

  useEffect(() => {
    if (status !== "ready") return;
    if (videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [status]);

  useEffect(() => {
    if (status !== "ready") return;

    const video = videoRef.current;
    const [track] = streamRef.current?.getVideoTracks() ?? [];
    if (!track) return;

    let isCancelled = false;

    // As capacidades de imagem do Chrome Android só ficam completas depois do
    // primeiro frame. Ler uma única vez logo após o `getUserMedia` devolve um
    // conjunto vazio e desliga flash e foco em aparelhos que os suportam; por
    // isso a leitura se repete no `loadedmetadata` e sempre que a track volta a
    // emitir depois de o app ficar em segundo plano.
    function readCapabilities() {
      if (isCancelled) return;

      const capabilities = track.getCapabilities?.();

      setIsFlashSupported(Boolean(capabilities?.torch));

      // Disparo único trava o foco no ponto tocado até o próximo toque; a
      // exposição fica contínua para que a compensação siga valendo como bias.
      const focusMode = pickMode(capabilities?.focusMode, [
        "single-shot",
        "continuous",
      ]);
      const exposureMode = pickMode(capabilities?.exposureMode, [
        "continuous",
        "single-shot",
      ]);

      focusModeRef.current = focusMode;
      exposureModeRef.current = exposureMode;
      setIsTapFocusSupported(
        supportsPointsOfInterest() && Boolean(focusMode || exposureMode),
      );

      const range = exposureMode ? readExposureRange(capabilities) : null;
      exposureRangeRef.current = range;
      setExposureRange(range);

      const setting = track.getSettings?.().exposureCompensation;
      const baseline =
        range && typeof setting === "number" && Number.isFinite(setting)
          ? snapExposure(setting, range)
          : 0;

      exposureBaselineRef.current = baseline;
      exposureValueRef.current = baseline;
      setExposureBaseline(baseline);
    }

    readCapabilities();

    video?.addEventListener("loadedmetadata", readCapabilities);
    track.addEventListener("unmute", readCapabilities);

    return () => {
      isCancelled = true;
      video?.removeEventListener("loadedmetadata", readCapabilities);
      track.removeEventListener("unmute", readCapabilities);
    };
  }, [status]);

  const applyConstraintParts = useCallback(async (patch: TrackConstraintParts) => {
    const [track] = streamRef.current?.getVideoTracks() ?? [];
    if (!track) return false;

    const next = { ...constraintsRef.current, ...patch };
    const advanced = [next.torch, next.focus, next.exposure].filter(
      (set): set is MediaTrackConstraintSet => Boolean(set),
    );

    try {
      await track.applyConstraints({ advanced });
      constraintsRef.current = next;
    } catch {
      return false;
    }

    // O Chrome Android tem um bug conhecido em que a lanterna ignora
    // `torch: false`, então o estado real do flash é o que o device relata.
    const { torch } = track.getSettings?.() ?? {};
    if (typeof torch === "boolean") setIsFlashOn(torch);

    return true;
  }, []);

  const toggleFlash = useCallback(async () => {
    const previous = isFlashOn;
    setIsFlashOn(!previous);

    if (!(await applyConstraintParts({ torch: { torch: !previous } }))) {
      setIsFlashOn(previous);
      setIsFlashSupported(false);
    }
  }, [applyConstraintParts, isFlashOn]);

  /** Recebe o ponto já normalizado em 0..1 no espaço do frame da track. */
  const focusAt = useCallback(
    async (point: FocusPoint) => {
      const focusMode = focusModeRef.current;
      const exposureMode = exposureModeRef.current;
      if (!focusMode && !exposureMode) return false;

      const pointsOfInterest = [
        { x: clamp(point.x, 0, 1), y: clamp(point.y, 0, 1) },
      ];

      // Um toque novo devolve a exposição ao valor de fábrica, como na câmera
      // nativa: o arrasto que vem em seguida parte sempre do mesmo lugar.
      const baseline = exposureBaselineRef.current;
      exposureValueRef.current = baseline;

      // O ponto de interesse é uma configuração única da track, não uma por
      // modo, então vai num conjunto só. O mesmo ponto alimenta foco e medição.
      const applied = await applyConstraintParts({
        focus: focusMode
          ? { focusMode, pointsOfInterest }
          : { pointsOfInterest },
        exposure: exposureMode
          ? {
              exposureMode,
              ...(exposureRangeRef.current
                ? { exposureCompensation: baseline }
                : {}),
            }
          : undefined,
      });

      if (!applied) setIsTapFocusSupported(false);

      return applied;
    },
    [applyConstraintParts],
  );

  const setExposureCompensation = useCallback(
    async (value: number) => {
      const range = exposureRangeRef.current;
      const exposureMode = exposureModeRef.current;
      if (!range || !exposureMode) return false;

      const snapped = snapExposure(value, range);
      if (snapped === exposureValueRef.current) return true;

      exposureValueRef.current = snapped;

      return applyConstraintParts({
        exposure: { exposureMode, exposureCompensation: snapped },
      });
    },
    [applyConstraintParts],
  );

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
    resetCapabilities();
  }, [resetCapabilities]);

  return {
    videoRef,
    status,
    error,
    isFlashSupported,
    isFlashOn,
    isTapFocusSupported,
    exposureRange,
    exposureBaseline,
    toggleFlash,
    focusAt,
    setExposureCompensation,
    capturePhoto,
    retry,
    start,
    stop,
  };
}
