// Sinal sonoro de fim de fase, sintetizado na hora com a Web Audio API. Um
// arquivo de áudio traria um binário, uma requisição e uma dúvida de licença
// para ganhar o mesmo bipe de duas notas.
let audioContext: AudioContext | null = null;

type AudioContextConstructor = typeof AudioContext;

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

// O AudioContext nasce suspenso até o primeiro gesto do usuário. Chamamos isto
// no clique de "Começar" para que o bipe do fim da fase consiga tocar depois.
export function unlockChime() {
  const context = getAudioContext();

  if (context === null) return;

  void context.resume().catch(() => {
    // Sem áudio disponível: a sessão continua funcionando em silêncio.
  });
}

function playNote(
  context: AudioContext,
  frequency: number,
  startAt: number,
  duration: number,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startAt);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.18, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}

// Subindo quando o foco termina, descendo quando a pausa termina: dá para saber
// que fase começou sem olhar para a tela.
export function playChime(direction: "up" | "down") {
  const context = getAudioContext();

  if (context === null) return;

  try {
    void context.resume().catch(() => {});

    const now = context.currentTime;
    const notes = direction === "up" ? [880, 1174.66] : [1174.66, 880];

    playNote(context, notes[0], now, 0.16);
    playNote(context, notes[1], now + 0.16, 0.24);
  } catch {
    // Áudio bloqueado pelo navegador: nada a fazer, o cronômetro segue.
  }
}
