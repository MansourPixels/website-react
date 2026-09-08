import type { SpeakOptions, SpeechDriver } from "../speech";

/**
 * Motor de fala do próprio navegador (Web Speech API).
 *
 * A API é notoriamente irregular entre navegadores, e quase todo o código aqui
 * existe para contornar um comportamento específico dela — cada um está
 * comentado no lugar onde importa.
 */

function getSynth(): SpeechSynthesis | null {
  // Acesso preguiçoso, nunca no topo do módulo: importar este arquivo num teste
  // em ambiente node não pode explodir. Mesmo cuidado que `sound.ts` toma com o
  // AudioContext.
  if (typeof window === "undefined") return null;

  return window.speechSynthesis ?? null;
}

let cachedVoice: SpeechSynthesisVoice | null = null;
let voiceLang: string | null = null;

/**
 * `getVoices()` volta vazio no primeiro tick no Chrome — a lista chega depois,
 * por evento. Guardamos a escolha e reavaliamos enquanto ela não existir.
 */
function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const synth = getSynth();

  if (synth === null) return null;
  if (cachedVoice !== null && voiceLang === lang) return cachedVoice;

  const voices = synth.getVoices();

  if (voices.length === 0) return null;

  const target = lang.toLowerCase();
  const base = target.split("-")[0];

  const exact = voices.find((voice) => voice.lang.toLowerCase() === target);
  const sameLanguage = voices.find((voice) =>
    voice.lang.toLowerCase().startsWith(base),
  );

  // Sem voz do idioma, devolvemos null e deixamos o navegador escolher: forçar
  // uma voz inglesa a ler português soa pior que a voz padrão do sistema.
  cachedVoice = exact ?? sameLanguage ?? null;
  voiceLang = lang;

  return cachedVoice;
}

let queue: string[] = [];
let index = 0;
let isCancelling = false;
let notify: (status: "idle" | "speaking" | "paused") => void = () => {};

function reset() {
  queue = [];
  index = 0;
  notify("idle");
}

function speakNext(options: SpeakOptions) {
  const synth = getSynth();

  if (synth === null) {
    reset();
    return;
  }

  if (index >= queue.length) {
    reset();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(queue[index]);
  const voice = pickVoice(options.lang);

  utterance.lang = options.lang;
  utterance.rate = options.rate;
  if (voice !== null) utterance.voice = voice;

  utterance.onend = () => {
    // `cancel()` também dispara `onend` em cada enunciado pendente; sem esta
    // guarda o cancelamento continuaria puxando o trecho seguinte da fila.
    if (isCancelling) return;

    index += 1;
    speakNext(options);
  };

  utterance.onerror = () => {
    if (isCancelling) return;

    // Um trecho recusado não deve derrubar a leitura inteira: segue no próximo.
    index += 1;
    speakNext(options);
  };

  synth.speak(utterance);
  notify("speaking");
}

let isListenerAttached = false;

/**
 * A fala sobrevive à navegação: numa SPA, sair da tela deixaria o narrador
 * lendo o conteúdo anterior. Estes dois eventos são a rede de segurança para
 * quando o componente não conseguir cancelar sozinho.
 */
function attachLifecycleListeners() {
  if (isListenerAttached || typeof window === "undefined") return;

  isListenerAttached = true;

  window.addEventListener("pagehide", () => {
    webSpeechDriver.cancel();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) webSpeechDriver.cancel();
  });
}

export const webSpeechDriver: SpeechDriver = {
  isSupported() {
    const synth = getSynth();

    return synth !== null && typeof window.SpeechSynthesisUtterance === "function";
  },

  speak(chunks, options) {
    const synth = getSynth();

    if (synth === null) {
      options.onStatusChange("idle");
      return;
    }

    attachLifecycleListeners();

    // Sem este cancelamento os enunciados se enfileiram e duas leituras tocam
    // sobrepostas — `speak` não substitui o que está falando.
    isCancelling = true;
    synth.cancel();
    isCancelling = false;

    queue = chunks;
    index = 0;
    notify = options.onStatusChange;

    speakNext(options);
  },

  cancel() {
    const synth = getSynth();

    if (synth === null) return;

    isCancelling = true;

    try {
      synth.cancel();
    } catch {
      // Alguns navegadores recusam a chamada com a fila já vazia.
    }

    isCancelling = false;
    reset();
  },

  pause() {
    const synth = getSynth();

    if (synth === null || !synth.speaking) return;

    try {
      synth.pause();
      notify("paused");
    } catch {
      // Pausa não suportada (é o caso de alguns Android): a fala segue.
    }
  },

  resume() {
    const synth = getSynth();

    if (synth === null || !synth.paused) return;

    try {
      synth.resume();
      notify("speaking");
    } catch {
      // Sem retomada disponível; o usuário pode parar e ouvir de novo.
    }
  },
};
