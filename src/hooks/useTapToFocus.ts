import { useCallback, useEffect, useRef, useState } from "react";
import { snapExposure, type ExposureRange, type FocusPoint } from "./useCamera";

/** Deslocamento vertical, em px, que separa um toque de um arrasto. */
const DRAG_THRESHOLD = 8;
/** Curso em px que percorre o intervalo inteiro de compensação de exposição. */
const DRAG_TRAVEL = 200;
/**
 * Intervalo mínimo entre chamadas de `applyConstraints`. Cada chamada atravessa
 * até o HAL da câmera e pode reconstruir a sessão de captura, então o arrasto é
 * coalescido para ~8 Hz em vez de acompanhar a taxa do ponteiro.
 */
const APPLY_INTERVAL = 120;
/** Quanto o reticle fica na tela depois que o dedo sai. */
const HOLD_DURATION = 2200;
const FADE_DURATION = 240;
/** Folga da borda a partir da qual o trilho de exposição troca de lado. */
const RAIL_EDGE_MARGIN = 96;

export interface FocusIndicator {
  key: number;
  x: number;
  y: number;
  isExposing: boolean;
  isFading: boolean;
  isFlipped: boolean;
  exposureRatio: number;
}

interface UseTapToFocusOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isEnabled: boolean;
  exposureRange: ExposureRange | null;
  exposureBaseline: number;
  focusAt: (point: FocusPoint) => Promise<boolean>;
  setExposureCompensation: (value: number) => Promise<boolean>;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function ratioOf(value: number, range: ExposureRange) {
  return clamp01((value - range.min) / (range.max - range.min));
}

/**
 * Converte um ponto em px da tela para o espaço normalizado 0..1 do frame da
 * track, desfazendo o recorte do `object-cover`. A conta só vale enquanto o
 * `<video>` usar o `object-position` padrão (centro) e não estiver espelhado —
 * aqui a câmera é sempre a traseira, sem `scale-x-[-1]`.
 *
 * Usa `videoWidth`/`videoHeight` e não `track.getSettings()`: no Android os dois
 * divergem quando o sensor entrega o frame rotacionado, e quem manda para o
 * recorte é o que está sendo exibido.
 */
function toTrackPoint(
  video: HTMLVideoElement,
  rect: DOMRect,
  clientX: number,
  clientY: number,
): FocusPoint | null {
  const { videoWidth, videoHeight } = video;
  if (!videoWidth || !videoHeight || !rect.width || !rect.height) return null;

  const scale = Math.max(rect.width / videoWidth, rect.height / videoHeight);
  const displayedWidth = videoWidth * scale;
  const displayedHeight = videoHeight * scale;

  return {
    x: clamp01(
      (clientX - rect.left - (rect.width - displayedWidth) / 2) / displayedWidth,
    ),
    y: clamp01(
      (clientY - rect.top - (rect.height - displayedHeight) / 2) /
        displayedHeight,
    ),
  };
}

/**
 * Toque para focar e arrasto vertical para compensar a exposição, no mesmo
 * gesto contínuo da câmera nativa.
 */
export function useTapToFocus({
  videoRef,
  isEnabled,
  exposureRange,
  exposureBaseline,
  focusAt,
  setExposureCompensation,
}: UseTapToFocusOptions) {
  const [indicator, setIndicator] = useState<FocusIndicator | null>(null);

  const pointerIdRef = useRef<number | null>(null);
  const originYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const exposureValueRef = useRef(0);

  const pendingRef = useRef<number | null>(null);
  const isApplyingRef = useRef(false);
  const applyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequenceRef = useRef(0);

  const clearHoldTimers = useCallback(() => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);

    holdTimerRef.current = null;
    fadeTimerRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (applyTimerRef.current) clearTimeout(applyTimerRef.current);
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isEnabled) return;

    pointerIdRef.current = null;
    isDraggingRef.current = false;
    clearHoldTimers();
    setIndicator(null);
  }, [isEnabled, clearHoldTimers]);

  // Um apply em voo por vez, sempre com o valor mais recente: os intermediários
  // do arrasto são descartados em vez de enfileirados.
  function drainExposure() {
    applyTimerRef.current = null;

    const value = pendingRef.current;
    if (value === null) return;

    if (isApplyingRef.current) {
      applyTimerRef.current = setTimeout(drainExposure, APPLY_INTERVAL);
      return;
    }

    pendingRef.current = null;
    isApplyingRef.current = true;

    setExposureCompensation(value)
      .catch(() => false)
      .finally(() => {
        isApplyingRef.current = false;

        if (pendingRef.current !== null && applyTimerRef.current === null) {
          applyTimerRef.current = setTimeout(drainExposure, APPLY_INTERVAL);
        }
      });
  }

  function queueExposure(value: number) {
    pendingRef.current = value;

    if (applyTimerRef.current === null && !isApplyingRef.current) {
      applyTimerRef.current = setTimeout(drainExposure, APPLY_INTERVAL);
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLVideoElement>) {
    if (!isEnabled || !event.isPrimary || pointerIdRef.current !== null) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const video = videoRef.current;
    if (!video) return;

    const rect = video.getBoundingClientRect();
    const point = toTrackPoint(video, rect, event.clientX, event.clientY);
    if (!point) return;

    clearHoldTimers();

    pointerIdRef.current = event.pointerId;
    originYRef.current = event.clientY;
    isDraggingRef.current = false;
    exposureValueRef.current = exposureBaseline;

    try {
      video.setPointerCapture(event.pointerId);
    } catch {
      // Alguns navegadores recusam a captura; o gesto segue sem ela.
    }

    const localX = event.clientX - rect.left;

    sequenceRef.current += 1;
    setIndicator({
      key: sequenceRef.current,
      x: localX,
      y: event.clientY - rect.top,
      isExposing: false,
      isFading: false,
      isFlipped: rect.width - localX < RAIL_EDGE_MARGIN,
      exposureRatio: exposureRange
        ? ratioOf(exposureBaseline, exposureRange)
        : 0.5,
    });

    void focusAt(point);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLVideoElement>) {
    if (pointerIdRef.current !== event.pointerId || !exposureRange) return;

    const offset = originYRef.current - event.clientY;
    if (!isDraggingRef.current && Math.abs(offset) < DRAG_THRESHOLD) return;

    const wasDragging = isDraggingRef.current;
    isDraggingRef.current = true;

    const span = exposureRange.max - exposureRange.min;
    const value = snapExposure(
      exposureBaseline + (offset / DRAG_TRAVEL) * span,
      exposureRange,
    );

    // Só há trabalho a fazer quando o passo de EV do aparelho muda de fato.
    if (wasDragging && value === exposureValueRef.current) return;

    exposureValueRef.current = value;
    queueExposure(value);

    setIndicator((current) =>
      current
        ? {
            ...current,
            isExposing: true,
            exposureRatio: ratioOf(value, exposureRange),
          }
        : current,
    );
  }

  function endGesture(event: React.PointerEvent<HTMLVideoElement>) {
    if (pointerIdRef.current !== event.pointerId) return;

    pointerIdRef.current = null;
    isDraggingRef.current = false;

    const video = videoRef.current;
    if (video?.hasPointerCapture(event.pointerId)) {
      video.releasePointerCapture(event.pointerId);
    }

    clearHoldTimers();
    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null;
      setIndicator((current) =>
        current ? { ...current, isExposing: false, isFading: true } : current,
      );

      fadeTimerRef.current = setTimeout(() => {
        fadeTimerRef.current = null;
        setIndicator(null);
      }, FADE_DURATION);
    }, HOLD_DURATION);
  }

  return {
    indicator,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: endGesture,
      onPointerCancel: endGesture,
      onLostPointerCapture: endGesture,
    },
  };
}
