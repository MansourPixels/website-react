import { chunkForSpeech } from "./speechText";

/**
 * Fachada única da leitura em voz alta.
 *
 * Nenhuma tela conhece `speechSynthesis`: todas passam por aqui. Trocar o
 * motor por uma API de fala na nuvem é escrever um `SpeechDriver` novo e
 * chamar `setSpeechDriver` uma vez no boot — nada mais no app muda.
 */

export type SpeechStatus = "idle" | "speaking" | "paused";

export interface SpeakOptions {
  /** Multiplicador de velocidade. 1 é o normal da voz. */
  rate: number;
  lang: string;
  onStatusChange: (status: SpeechStatus) => void;
}

export interface SpeechDriver {
  isSupported: () => boolean;
  /** Recebe o texto já fatiado em trechos faláveis. */
  speak: (chunks: string[], options: SpeakOptions) => void;
  cancel: () => void;
  pause: () => void;
  resume: () => void;
}

export const DEFAULT_SPEECH_LANG = "pt-BR";
export const SPEECH_RATE_RANGE = { min: 0.5, max: 2, step: 0.1 } as const;

/** Motor inerte: é o que responde no servidor e em navegador sem suporte. */
const noopDriver: SpeechDriver = {
  isSupported: () => false,
  speak: (_chunks, options) => options.onStatusChange("idle"),
  cancel: () => {},
  pause: () => {},
  resume: () => {},
};

let driver: SpeechDriver = noopDriver;

/** O ponto de troca. Chamado uma vez, no boot do app. */
export function setSpeechDriver(next: SpeechDriver) {
  driver.cancel();
  driver = next;
}

export function isSpeechSupported(): boolean {
  return driver.isSupported();
}

export function speak(text: string, options: Partial<SpeakOptions> = {}) {
  const chunks = chunkForSpeech(text);

  if (chunks.length === 0) {
    options.onStatusChange?.("idle");
    return;
  }

  driver.speak(chunks, {
    rate: options.rate ?? 1,
    lang: options.lang ?? DEFAULT_SPEECH_LANG,
    onStatusChange: options.onStatusChange ?? (() => {}),
  });
}

export function cancelSpeech() {
  driver.cancel();
}

export function pauseSpeech() {
  driver.pause();
}

export function resumeSpeech() {
  driver.resume();
}
