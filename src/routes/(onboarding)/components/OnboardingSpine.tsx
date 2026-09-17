import { cn } from "@heroui/styles";

interface OnboardingSpineProps {
  /** 1-indexado, como o rótulo que aparece na tela. */
  position: number;
  total: number;
  label: string;
}

/**
 * Espelha o `PlanSpine` da Trilha em vez de reusá-lo: aquele é tipado em
 * `StudyPlanStep[]` e deriva "concluída" de cada etapa, enquanto aqui o
 * progresso é estritamente linear. Generalizar os dois amarraria o runner de
 * plano de estudo ao onboarding sem ganho.
 */
export function OnboardingSpine({
  position,
  total,
  label,
}: OnboardingSpineProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      <p className="text-muted flex flex-wrap items-center justify-center gap-x-2 text-center text-sm">
        <span className="tabular-nums">
          Passo {position} de {total}
        </span>
        <span aria-hidden>·</span>
        <span className="text-pretty">{label}</span>
      </p>

      <div aria-hidden className="flex items-center gap-1.5">
        {Array.from({ length: total }, (_, index) => {
          const isDone = index < position - 1;
          const isCurrent = index === position - 1;

          return (
            <span
              key={index}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-300 ease-(--ease-out-strong)",
                isDone
                  ? "bg-accent"
                  : isCurrent
                    ? "bg-accent/40"
                    : "bg-foreground/10",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
