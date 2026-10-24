interface DrawCountdownProps {
  /** Segundos que faltam. Em 0, a contagem acabou e falta só a resposta. */
  value: number;
  /** Duração total, para a barra esvaziar no mesmo ritmo dos números. */
  totalSeconds: number;
  prize: string;
}

// Ocupa a tela inteira por cima de tudo: na TV, a contagem é o momento do
// evento, e nada mais deve disputar a atenção.
export function DrawCountdown({ value, totalSeconds, prize }: DrawCountdownProps) {
  return (
    <div
      role="timer"
      aria-live="assertive"
      className="fixed inset-0 z-90 flex flex-col items-center justify-center gap-[4vh] bg-accent p-8 text-center text-accent-foreground"
    >
      <p className="text-[clamp(1.5rem,3.5vw,4rem)] font-semibold text-balance">
        Sorteando {prize}…
      </p>

      {/* `key` remonta o número a cada segundo, o que reinicia a animação. */}
      <span
        key={value}
        className="countdown-tick text-[min(48vh,40vw)] leading-none font-bold tabular-nums"
      >
        {value > 0 ? value : "🎉"}
      </span>

      <div className="h-[1.2vh] min-h-2 w-[min(60vw,48rem)] overflow-hidden rounded-full bg-accent-foreground/25">
        <div
          className="countdown-drain h-full rounded-full bg-accent-foreground"
          style={{ animationDuration: `${totalSeconds}s` }}
        />
      </div>
    </div>
  );
}
