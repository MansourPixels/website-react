const SOUNDS_BASE = "/audios";
const SOUND_GAIN = 0.8;

type AudioContextConstructor = typeof AudioContext;

let audioContext: AudioContext | null = null;

/** `null` no valor significa "já tentei carregar e não deu" — não retenta. */
const buffers = new Map<string, AudioBuffer | null>();
const pending = new Map<string, Promise<AudioBuffer | null>>();

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  const Constructor =
    window.AudioContext ??
    (window as { webkitAudioContext?: AudioContextConstructor })
      .webkitAudioContext;

  if (Constructor === undefined) return null;

  audioContext ??= new Constructor();

  return audioContext;
}

/**
 * Precisa ser chamado de dentro de um gesto do usuário: as políticas de
 * autoplay criam o contexto em `suspended` e só um `resume()` originado em
 * interação o libera.
 */
export function unlockAudio() {
  const context = getAudioContext();

  if (context === null || context.state === "running") return;

  void context.resume().catch(() => {
    // Sem ativação válida ainda; a próxima interação tenta de novo.
  });
}

/**
 * Retomada fora de um gesto — só faz sentido depois de um `unlockAudio` bem
 * sucedido, quando o contexto foi interrompido por ligação ou troca de app.
 */
export function resumeAudio() {
  unlockAudio();
}

function loadSound(name: string): Promise<AudioBuffer | null> {
  const cached = buffers.get(name);
  if (cached !== undefined) return Promise.resolve(cached);

  const inFlight = pending.get(name);
  if (inFlight !== undefined) return inFlight;

  const context = getAudioContext();
  if (context === null) return Promise.resolve(null);

  const request = (async () => {
    try {
      const response = await fetch(`${SOUNDS_BASE}/${name}.mp3`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const buffer = await context.decodeAudioData(await response.arrayBuffer());
      buffers.set(name, buffer);

      return buffer;
    } catch {
      // Arquivo ausente ou formato recusado: o som some e o resto segue. É o
      // estado esperado enquanto `public/audios` não estiver preenchida.
      buffers.set(name, null);

      return null;
    } finally {
      pending.delete(name);
    }
  })();

  pending.set(name, request);

  return request;
}

export function playSound(name: string) {
  const context = getAudioContext();
  if (context === null) return;

  void loadSound(name).then((buffer) => {
    // O contexto pode ter voltado a `suspended` (aba em segundo plano) entre o
    // pedido e a decodificação; tocar aí só enfileiraria áudio atrasado.
    if (buffer === null || context.state !== "running") return;

    const source = context.createBufferSource();
    const gain = context.createGain();

    source.buffer = buffer;
    gain.gain.value = SOUND_GAIN;

    source.connect(gain);
    gain.connect(context.destination);
    source.start();
  });
}

/**
 * Aquece o cache antes do primeiro uso. A primeira reprodução de um som ainda
 * não decodificado embute a latência da rede, o que estraga justamente os sons
 * que precisam ser imediatos (obturador, virada de card).
 */
export function prefetchSounds(names: readonly string[]) {
  for (const name of names) {
    void loadSound(name);
  }
}
