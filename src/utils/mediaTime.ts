import type { TranscriptSegment } from "@/types/api/media";

/** `m:ss`, ou `h:mm:ss` a partir de uma hora; frações e negativos caem para baixo/zero. */
export function formatTimestamp(seconds: number): string {
  const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const two = (value: number) => value.toString().padStart(2, "0");

  return hours > 0
    ? `${hours}:${two(minutes)}:${two(secs)}`
    : `${minutes}:${two(secs)}`;
}

/**
 * O segmento que está sendo falado em `time`, ou `-1` antes do primeiro.
 * `segments` vem ordenado por `startSeconds`, então a busca é binária: uma
 * aula de horas tem milhares de segmentos e isto roda a cada `timeupdate`.
 * Entre dois segmentos (uma pausa) vale o anterior.
 */
export function activeSegmentIndex(
  segments: readonly Pick<TranscriptSegment, "startSeconds">[],
  time: number,
): number {
  let low = 0;
  let high = segments.length - 1;
  let found = -1;

  while (low <= high) {
    const middle = (low + high) >> 1;

    if (segments[middle].startSeconds <= time) {
      found = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return found;
}

/** Mantém um salto dentro do áudio; sem duração conhecida só impede o negativo. */
export function clampSeek(time: number, duration: number | null | undefined): number {
  const safe = Number.isFinite(time) ? Math.max(0, time) : 0;

  return typeof duration === "number" && duration > 0
    ? Math.min(safe, duration)
    : safe;
}
