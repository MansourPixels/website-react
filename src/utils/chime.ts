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

export function unlockChime() {
  const context = getAudioContext();

  if (context === null) return;

  void context.resume().catch(() => {
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
  }
}
