import type { PerformanceByDiscipline } from "@/types/api/performance";
import { Button, Meter } from "@heroui/react";
import { useState } from "react";

// A lista cresce com o aluno: sem teto, 20 disciplinas esticam a coluna
// esquerda e desalinham a comparação com o plano de estudos ao lado.
const VISIBLE_LIMIT = 6;

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
  const [isShowingAll, setIsShowingAll] = useState(false);

  const visibleDisciplines = isShowingAll
    ? disciplines
    : disciplines.slice(0, VISIBLE_LIMIT);

  return (
    <section className="bg-surface rounded-3xl shadow-surface p-4 flex flex-col gap-4">
      <header>
        <h2 className="font-semibold">Aproveitamento por disciplina</h2>
        <p className="text-sm text-muted">
          Percentual de acertos nos simulados de cada disciplina.
        </p>
      </header>

      {disciplines.length > 0 ? (
        <>
          <ul className="flex flex-col gap-4">
            {visibleDisciplines.map(
              ({
                motherFolderId,
                motherFolderName,
                accuracyPercentage,
                totalAttempts,
              }) => (
                <li
                  key={motherFolderId}
                  className="grid grid-cols-[4.5rem_1fr_4.5rem] items-center gap-x-3 gap-y-1"
                >
                  <h3
                    className="min-w-0 truncate text-sm font-medium"
                    title={motherFolderName}
                  >
                    {motherFolderName}
                  </h3>

                  <Meter
                    value={accuracyPercentage}
                    color={accuracyColor(accuracyPercentage)}
                    aria-label={`${motherFolderName}: ${Math.round(accuracyPercentage)}% de aproveitamento`}
                  >
                    <Meter.Track>
                      <Meter.Fill />
                    </Meter.Track>
                  </Meter>

                  <span className="shrink-0 text-right text-sm font-semibold tabular-nums">
                    {Math.round(accuracyPercentage)}%
                  </span>

                  <p className="col-start-2 col-span-2 text-xs text-muted">
                    <span className="tabular-nums">{totalAttempts}</span>{" "}
                    {totalAttempts === 1
                      ? "simulado respondido"
                      : "simulados respondidos"}
                  </p>
                </li>
              ),
            )}
          </ul>

          {disciplines.length > VISIBLE_LIMIT ? (
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              onPress={() => setIsShowingAll((current) => !current)}
            >
              {isShowingAll
                ? "Ver menos disciplinas"
                : `Ver todas as ${disciplines.length} disciplinas`}
            </Button>
          ) : null}
        </>
      ) : (
        <p className="text-muted text-sm">
          Nenhuma disciplina com simulados respondidos ainda.
        </p>
      )}
    </section>
  );
}
