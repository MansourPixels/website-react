import { Button, cn, Meter } from "@heroui/react";
import {
  Coffee,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  SkipForward,
  Timer,
} from "lucide-react";

import { formatCountdown, phaseLabels } from "@/hooks/useStudySession";
import type { SessionPhase, SessionStatus } from "@/types/StudySession";

interface SessionTimerProps {
  phase: SessionPhase;
  status: SessionStatus;
  remainingMs: number;
  totalMs: number;
  completedFocus: number;
  cycleInRound: number;
  cyclesUntilLongBreak: number;
  announcement?: string;
  onToggle: () => void;
  onReset: () => void;
  onSkip: () => void;
  onOpenSettings?: () => void;
  isCompact?: boolean;
}

export function SessionTimer({
  phase,
  status,
  remainingMs,
  totalMs,
  completedFocus,
  cycleInRound,
  cyclesUntilLongBreak,
  announcement = "",
  onToggle,
  onReset,
  onSkip,
  onOpenSettings,
  isCompact = false,
}: SessionTimerProps) {
  const isFocus = phase === "focus";
  const isRunning = status === "running";
  const hasStarted = remainingMs < totalMs;

  const PhaseIcon = isFocus ? Timer : Coffee;
  const toggleLabel = isRunning ? "Pausar" : hasStarted ? "Retomar" : "Começar";

  return (
    <section
      className={cn(
        "flex flex-col items-center gap-6 rounded-3xl bg-white shadow-surface",
        isCompact ? "p-5" : "p-6",
      )}
    >
      <header className="flex w-full items-center justify-between gap-2">
        <span
          className={cn(
            "flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium",
            isFocus ? "bg-accent-soft text-accent" : "bg-default text-muted",
          )}
        >
          <PhaseIcon className="size-4" />
          {phaseLabels[phase]}
        </span>

        {onOpenSettings ? (
          <Button
            isIconOnly
            variant="tertiary"
            aria-label="Ajustar a sessão"
            onPress={onOpenSettings}
          >
            <Settings2 className="size-4" />
          </Button>
        ) : null}
      </header>

      <p
        role="timer"
        aria-label="Tempo restante"
        className={cn(
          "font-extrabold tabular-nums leading-none",
          isCompact ? "text-6xl" : "text-7xl",
        )}
      >
        {formatCountdown(remainingMs)}
      </p>

      <Meter
        value={totalMs - remainingMs}
        maxValue={totalMs}
        color="accent"
        className="w-full"
        aria-label="Progresso da fase"
        aria-hidden="true"
      >
        <Meter.Track>
          <Meter.Fill />
        </Meter.Track>
      </Meter>

      <div className="flex items-center gap-2">
        <Button
          isIconOnly
          variant="ghost"
          aria-label="Reiniciar a fase"
          onPress={onReset}
        >
          <RotateCcw className="size-5" />
        </Button>

        <Button variant="primary" size="lg" onPress={onToggle}>
          {isRunning ? (
            <Pause className="size-4" />
          ) : (
            <Play className="size-4" />
          )}
          {toggleLabel}
        </Button>

        <Button
          isIconOnly
          variant="ghost"
          aria-label="Pular para a próxima fase"
          onPress={onSkip}
        >
          <SkipForward className="size-5" />
        </Button>
      </div>

      <footer className="flex flex-col items-center gap-2">
        <ul className="flex items-center gap-1.5" aria-hidden="true">
          {Array.from({ length: cyclesUntilLongBreak }, (_, index) => (
            <li
              key={index}
              className={cn(
                "size-2 rounded-full",
                index < cycleInRound ? "bg-accent" : "bg-default",
              )}
            />
          ))}
        </ul>

        <p className="text-sm text-muted tabular-nums">
          Ciclos concluídos hoje: {completedFocus}
        </p>

        <span className="sr-only">
          Ciclo {Math.min(cycleInRound + 1, cyclesUntilLongBreak)} de{" "}
          {cyclesUntilLongBreak} até a pausa longa.
        </span>
      </footer>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </section>
  );
}
