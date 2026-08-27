import type { PerformanceByDiscipline } from "@/types/api/performance";
import { Meter } from "@heroui/react";

function accuracyColor(accuracy: number) {
  if (accuracy >= 75) return "success" as const;
  if (accuracy >= 50) return "accent" as const;
  return "warning" as const;
}

interface DisciplinePerformanceListProps {
  disciplines: PerformanceByDiscipline[];
}

export function DisciplinePerformanceList({
  disciplines,
}: DisciplinePerformanceListProps) {
  return (
    <section className="bg-white rounded-3xl shadow-surface p-4 flex flex-col gap-4">
      <header>
        <h2 className="font-semibold">Aproveitamento por disciplina</h2>
        <p className="text-sm text-muted">
          Percentual de acertos nos simulados de cada disciplina.
        </p>
      </header>

      {disciplines.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {disciplines.map(
            ({
              motherFolderId,
              motherFolderName,
              accuracyPercentage,
              totalAttempts,
            }) => (
              <li key={motherFolderId} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-medium">{motherFolderName}</h3>
                  <span className="text-sm font-semibold tabular-nums">
                    {Math.round(accuracyPercentage)}%
                  </span>
                </div>

                <Meter
                  value={accuracyPercentage}
                  color={accuracyColor(accuracyPercentage)}
                  aria-label={`${motherFolderName}: ${Math.round(accuracyPercentage)}% de aproveitamento`}
                >
                  <Meter.Track>
                    <Meter.Fill />
                  </Meter.Track>
                </Meter>

                <p className="text-sm text-muted">
                  {totalAttempts}{" "}
                  {totalAttempts === 1
                    ? "simulado respondido"
                    : "simulados respondidos"}
                </p>
              </li>
            ),
          )}
        </ul>
      ) : (
        <p className="text-muted text-sm">
          Nenhuma disciplina com simulados respondidos ainda.
        </p>
      )}
    </section>
  );
}
