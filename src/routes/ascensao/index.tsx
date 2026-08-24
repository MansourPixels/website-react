import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, Clock, Snowflake, Trophy } from "lucide-react";

import { NavMenu } from "@/components/NavMenu";
import { StatTile } from "@/components/StatTile";
import { ascension } from "@/mocks/ascension";
import { formatDuration } from "@/utils/time";
import { AscentionCalendar } from "./-components/AscentionCalendar";
import { MilestoneList } from "./-components/MilestoneList";
import { MonthlyAscension } from "./-components/MonthlyAscension";
import { StreakWeek } from "./-components/StreakWeek";

export const Route = createFileRoute("/ascensao/")({
  component: Ascensao,
});

function Ascensao() {
  const {
    currentStreak,
    recordStreak,
    freezes,
    daysThisMonth,
    minutesThisWeek,
    week,
    milestones,
    months,
  } = ascension;

  return (
    <main className="p-6 gap-8 flex flex-col w-full max-w-6xl mx-auto">
      <NavMenu title="Ascensão" />

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-2 bg-accent-soft p-4 rounded-3xl">
            <h2 className="grid">
              <span className="text-7xl font-extrabold text-transparent bg-clip-text bg-white [-webkit-text-stroke:3px_var(--accent)]">
                {currentStreak}
              </span>
              <span className="text-3xl text-accent font-semibold">
                Dias em ascensão
              </span>
            </h2>
            <div className="flex items-center justify-end">
              <img src="/icone-ascensao.svg" alt="Ícone de ascensão" />
            </div>
          </div>

          <p className="text-center text-balance lg:text-left">
            Essa é a sua sequência de estudos diários! Faltam{" "}
            {recordStreak - currentStreak} dias para bater o seu recorde. Não
            deixe a chama azul se apagar.
          </p>

          <StreakWeek week={week} />

          <section
            id="indicadores-ascensao"
            className="grid grid-cols-2 lg:grid-cols-4 gap-3"
          >
            <StatTile
              label="Recorde"
              value={`${recordStreak} dias`}
              hint="Sua maior sequência"
              icon={Trophy}
            />
            <StatTile
              label="Dias neste mês"
              value={`${daysThisMonth}`}
              hint="de 31 dias"
              icon={CalendarCheck}
            />
            <StatTile
              label="Tempo na semana"
              value={formatDuration(minutesThisWeek)}
              hint="Somando todos os assuntos"
              icon={Clock}
            />
            <StatTile
              label="Protetores de chama"
              value={`${freezes}`}
              hint="Seguram a ascensão por 1 dia"
              icon={Snowflake}
            />
          </section>

          <MonthlyAscension months={months} />
        </div>

        <aside className="flex flex-col gap-8">
          <section className="bg-white rounded-3xl shadow-surface p-4 flex flex-col gap-3">
            <h2 className="font-semibold">Calendário</h2>
            <AscentionCalendar />
          </section>

          <MilestoneList
            milestones={milestones}
            currentStreak={currentStreak}
          />
        </aside>
      </div>
    </main>
  );
}
