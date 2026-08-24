import type { DisciplinePerformance } from "@/mocks/performance";
import { cn, Meter } from "@heroui/react";
import { TrendingDown, TrendingUp } from "lucide-react";

function accuracyColor(accuracy: number) {
  if (accuracy >= 75) return "success" as const;
  if (accuracy >= 50) return "accent" as const;
  return "warning" as const;
}

interface DisciplinePerformanceListProps {
  disciplines: DisciplinePerformance[];
}

export function DisciplinePerformanceList({
  disciplines,
}: DisciplinePerformanceListProps) {
  return (
    <section className="bg-white rounded-3xl p-4 flex flex-col gap-4">
      <header>
        <h2 className="font-semibold">Aproveitamento por disciplina</h2>
        <p className="text-sm text-muted">
          Percentual de acertos nos flash cards e simulados de cada disciplina.
        </p>
      </header>

      <ul className="flex flex-col gap-4">
        {disciplines.map(({ name, accuracy, cards, delta }) => {
          const isPositive = delta >= 0;
          const DeltaIcon = isPositive ? TrendingUp : TrendingDown;

          return (
            <li key={name} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-medium">{name}</h3>
                <span className="text-sm font-semibold tabular-nums">
                  {accuracy}%
                </span>
              </div>

              <Meter
                value={accuracy}
                color={accuracyColor(accuracy)}
                aria-label={`${name}: ${accuracy}% de aproveitamento`}
              >
                <Meter.Track>
                  <Meter.Fill />
                </Meter.Track>
              </Meter>

              <div className="flex items-center justify-between gap-3 text-sm text-muted">
                <span>{cards} cartões revisados</span>
                <span
                  className={cn(
                    "flex items-center gap-1",
                    isPositive ? "text-success" : "text-danger",
                  )}
                >
                  <DeltaIcon className="size-4 shrink-0" />
                  {isPositive ? "+" : "−"}
                  {Math.abs(delta)} pts
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
