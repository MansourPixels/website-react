import { cn } from "@heroui/styles";

interface PlanSpineProps {
  position: number;
  total: number;
  focus: string;
  completedCount: number;
}

export function PlanSpine({
  position,
  total,
  focus,
  completedCount,
}: PlanSpineProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm opacity-70 flex flex-wrap items-center gap-x-2 justify-center text-center">
        <span className="tabular-nums">
          Etapa {String(position).padStart(2, "0")} de{" "}
          {String(total).padStart(2, "0")}
        </span>
        <span aria-hidden>·</span>
        <span className="text-pretty">{focus}</span>
      </p>

      <p className="sr-only">
        {completedCount} de {total} etapas concluídas.
      </p>

      <div aria-hidden className="flex items-center gap-1.5">
        {Array.from({ length: total }, (_, index) => {
          const isDone = index < completedCount;
          const isCurrent = index === position - 1;

          return (
            <span
              key={index}
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
