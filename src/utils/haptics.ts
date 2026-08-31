export type HapticPattern =
  | "tap"
  | "impact"
  | "success"
  | "error"
  | "achievement";

/**
 * Vocabulário fechado de padrões. Duração em ms; arrays alternam vibração e
 * pausa. Os valores são curtos de propósito — vibração longa em app de estudo
 * lê como notificação, não como resposta ao toque. O piso é 15ms: muitos
 * motores Android não produzem nada perceptível abaixo disso.
 */
const PATTERNS: Record<HapticPattern, number | number[]> = {
  tap: 15,
  impact: 25,
  success: [12, 40, 24],
  error: [30, 50, 30],
  achievement: [12, 30, 12, 30, 40],
};

const PRIORITY: Record<HapticPattern, number> = {
  tap: 0,
  impact: 1,
  error: 2,
  success: 2,
  achievement: 3,
};

/**
 * O Safari não implementa a Vibration API em nenhuma versão, então isto é
 * inerte no iPhone por natureza — lá o retorno sonoro trabalha sozinho.
 */
export function isHapticsSupported() {
  return (
    typeof navigator !== "undefined" && typeof navigator.vibrate === "function"
  );
}

let queued: HapticPattern | null = null;

function flush() {
  const pattern = queued;
  queued = null;

  if (pattern === null) return;

  try {
    navigator.vibrate(PATTERNS[pattern]);
  } catch {
    // Alguns navegadores expõem a API e recusam a chamada; o toque não vibra.
  }
}

/**
 * Um gesto produz uma vibração só. O toque genérico global e o retorno
 * específico da ação chegam no mesmo clique, e `navigator.vibrate` substitui o
 * padrão em andamento — sem árbitro, quem vence é quem registrou o listener por
 * último, o que é arbitrário. O `setTimeout` (e não `queueMicrotask`) é
 * necessário porque o checkpoint de microtasks roda entre um listener e o
 * seguinte, o que não coalesceria nada.
 */
export function vibrate(pattern: HapticPattern) {
  if (!isHapticsSupported()) return;
  if (typeof document !== "undefined" && document.hidden) return;

  if (queued !== null) {
    if (PRIORITY[pattern] > PRIORITY[queued]) queued = pattern;
    return;
  }

  queued = pattern;
  setTimeout(flush, 0);
}
