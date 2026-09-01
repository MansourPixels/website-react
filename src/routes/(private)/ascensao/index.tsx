import { Spinner } from "@heroui/react";
import { CalendarCheck, CalendarDays, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

import { ApiError } from "@/api/client";
import { getStreak } from "@/api/streak";
import { NavMenu } from "@/components/NavMenu";
import { StatTile } from "@/components/StatTile";
import { useAchievementFeedback } from "@/hooks/useAchievementFeedback";
import type { StreakStatus } from "@/types/api/streak";
import { AscentionCalendar } from "./components/AscentionCalendar";
import { MilestoneList } from "./components/MilestoneList";
import { TodayChecklist } from "./components/TodayChecklist";

export default function Ascensao() {
  const [streak, setStreak] = useState<StreakStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useAchievementFeedback(streak);

  useEffect(() => {
    let cancelled = false;

    getStreak()
      .then((result) => {
        if (!cancelled) setStreak(result);
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        setLoadError(
          error instanceof ApiError
            ? error.detail
            : "Não foi possível carregar sua ascensão. Tente novamente.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="p-6 gap-8 flex flex-col w-full max-w-6xl mx-auto">
      <NavMenu title="Ascensão" hasBackButton backHref="/perfil" />

      {loadError !== null ? (
        <p className="text-danger text-center py-8">{loadError}</p>
      ) : streak === null ? (
        <div
          className="flex flex-1 items-center justify-center p-6"
          aria-busy="true"
        >
          <Spinner size="lg" />
          <span className="sr-only">Carregando ascensão</span>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-[1fr_auto] items-center gap-4 bg-accent-soft p-4 rounded-3xl">
              <h2 className="grid min-w-0">
                <span className="text-7xl font-extrabold text-transparent bg-clip-text bg-white [-webkit-text-stroke:3px_var(--accent)] tabular-nums">
                  {streak.currentStreak}
                </span>
                <span className="text-3xl text-accent font-semibold text-balance">
                  Dias em ascensão
                </span>
              </h2>
              <img
                src="/icone-ascensao.svg"
                alt="Ícone de ascensão"
                className="w-20 sm:w-24 h-auto shrink-0"
              />
            </div>

            <p className="text-center text-balance lg:text-left">
              {streak.currentStreak >= streak.recordStreak &&
              streak.currentStreak > 0
                ? "Você está na sua maior sequência de estudos até agora! Não deixe a chama azul se apagar."
                : streak.recordStreak > 0
                  ? `Essa é a sua sequência de estudos diários! Faltam ${streak.recordStreak - streak.currentStreak} dias para bater o seu recorde. Não deixe a chama azul se apagar.`
                  : "Essa é a sua sequência de estudos diários! Comece hoje para acender a primeira chama."}
            </p>

            <TodayChecklist today={streak.today} isGold={streak.todayIsGold} />

            <section
              id="indicadores-ascensao"
              className="grid grid-cols-2 lg:grid-cols-3 gap-3"
            >
              <StatTile
                label="Recorde"
                value={`${streak.recordStreak} dias`}
                hint="Sua maior sequência"
                icon={Trophy}
              />
              <StatTile
                label="Dias neste mês"
                value={`${streak.daysThisMonth}`}
                hint="Com pelo menos uma atividade"
                icon={CalendarCheck}
              />
              <StatTile
                label="Dias ativos na semana"
                value={`${streak.daysActiveThisWeek}`}
                hint="Últimos 7 dias, incluindo hoje"
                icon={CalendarDays}
              />
            </section>
          </div>

          <aside className="flex flex-col gap-8">
            <section className="bg-white rounded-3xl shadow-surface p-4 flex flex-col gap-3">
              <h2 className="font-semibold">Calendário</h2>
              <AscentionCalendar />
            </section>

            <MilestoneList currentStreak={streak.currentStreak} />
          </aside>
        </div>
      )}
    </main>
  );
}
