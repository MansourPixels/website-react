import type { StudyPlanStep } from "@/types/api/studyPlan";
import { cn } from "@heroui/styles";

interface PlanSpineProps {
  position: number;
  disciplineName: string;
  steps: StudyPlanStep[];
}

export function PlanSpine({ position, disciplineName, steps }: PlanSpineProps) {
  const total = steps.length;
  const completedCount = steps.filter((step) => step.completed).length;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm opacity-70 flex flex-wrap items-center gap-x-2 justify-center text-center">
        <span className="tabular-nums">
          Etapa {String(position).padStart(2, "0")} de{" "}
          {String(total).padStart(2, "0")}
        </span>
        <span aria-hidden>·</span>
        <span className="text-pretty">{disciplineName}</span>
      </p>

      <p className="sr-only">
        {completedCount} de {total} etapas concluídas.
      </p>

      <div aria-hidden className="flex items-center gap-1.5">
        {steps.map((step, index) => {
          // Cada segmento é a etapa daquela posição, não uma contagem global:
          // as linhas do plano permitem pular ordem, então concluir a 1 e a 3
          // não pode acender a 2.
          const isDone = step.completed;
          const isCurrent = index === position - 1;

          return (
            <span
              key={step.id}
              className={cn(
                "h-1.5 flex-1 rounded-full",
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
