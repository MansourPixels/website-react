import { createFileRoute } from "@tanstack/react-router";
import { Clock, FileStack, ListCheck, NotebookPen } from "lucide-react";

import { NavMenu } from "@/components/NavMenu";
import { StatTile } from "@/components/StatTile";
import { performance } from "@/mocks/performance";
import { formatDuration } from "@/utils/time";
import { DisciplinePerformanceList } from "./-components/DisciplinePerformanceList";
import { StudyPlanCard } from "./-components/StudyPlanCard";
import { WeeklyStudyList } from "./-components/WeeklyStudyList";

export const Route = createFileRoute("/trilha/")({
  component: PathPage,
});

function PathPage() {
  const {
    overallAccuracy,
    accuracyDelta,
    studiedSubjects,
    reviewedCards,
    practiceTests,
    minutesThisWeek,
    cardsDelta,
    testsDelta,
    minutesDelta,
    disciplines,
    week,
    plans,
  } = performance;

  const attentionPoints = disciplines
    .filter((discipline) => discipline.accuracy < 60)
    .map((discipline) => discipline.name);

  return (
    <main className="p-6 gap-8 flex flex-col w-full max-w-6xl mx-auto">
      <NavMenu title="Trilha" hasSearch />

      <div className="grid grid-cols-2 bg-accent-soft p-4 rounded-3xl items-center gap-4">
        <h2 className="grid">
          <span className="text-7xl font-extrabold text-transparent bg-clip-text bg-white [-webkit-text-stroke:3px_var(--accent)]">
            {overallAccuracy}%
          </span>
          <span className="text-2xl text-accent font-semibold">
            de aproveitamento geral
          </span>
        </h2>
        <p className="text-accent-soft-foreground text-sm text-balance">
          Você subiu {accuracyDelta} pontos em relação à semana anterior,
          somando flash cards e simulados de todas as disciplinas.
        </p>
      </div>

      <section
        id="indicadores-gerais"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <StatTile
          label="Assuntos estudados"
          value={`${studiedSubjects}`}
          hint="Em todas as pastas"
          icon={NotebookPen}
        />
        <StatTile
          label="Cartões revisados"
          value={`${reviewedCards}`}
          delta={cardsDelta}
          icon={FileStack}
        />
        <StatTile
          label="Simulados feitos"
          value={`${practiceTests}`}
          delta={testsDelta}
          icon={ListCheck}
        />
        <StatTile
          label="Tempo de estudo"
          value={formatDuration(minutesThisWeek)}
          delta={minutesDelta}
          deltaSuffix="min"
          icon={Clock}
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-start">
        <div className="flex flex-col gap-8">
          <DisciplinePerformanceList disciplines={disciplines} />
          <WeeklyStudyList week={week} />
        </div>

        <section id="plano-estudos" className="flex flex-col gap-4">
          <header className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">Plano de estudos sugerido</h2>
            <p className="text-sm">
              {attentionPoints.length > 0 ? (
                <>
                  Foi identificada uma queda de domínio nos assuntos
                  relacionados a{" "}
                  {attentionPoints.map((name, index) => (
                    <span key={name}>
                      {index > 0
                        ? index === attentionPoints.length - 1
                          ? " e "
                          : ", "
                        : null}
                      <strong>{name}</strong>
                    </span>
                  ))}
                  . Vamos focar para melhorar isso? 😎
                </>
              ) : (
                "Nenhuma disciplina pedindo atenção no momento. Continue assim! 😎"
              )}
            </p>
          </header>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
            {plans.map((plan) => (
              <StudyPlanCard key={plan.discipline} plan={plan} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
