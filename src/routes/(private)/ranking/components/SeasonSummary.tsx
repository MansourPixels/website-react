import { Sparkles, Trophy } from "lucide-react";

import { StatTile } from "@/components/StatTile";
import type { RankingSummary } from "@/types/api/ranking";
import {
  formatPosition,
  formatResetCountdown,
  formatResetDate,
} from "@/utils/ranking";

interface SeasonSummaryProps {
  summary: RankingSummary;
}

export function SeasonSummary({ summary }: SeasonSummaryProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <StatTile
          label="Sua posição"
          value={formatPosition(summary.position)}
          hint={
            summary.position === null
              ? "Estude para entrar no ranking"
              : `de ${summary.total} ${summary.total === 1 ? "pessoa" : "pessoas"}`
          }
          icon={Trophy}
        />
        <StatTile
          label="Seu XP na temporada"
          value={summary.xp.toLocaleString("pt-BR")}
          hint={`${summary.flashcards} flash cards · ${summary.quizzes} ${
            summary.quizzes === 1 ? "simulado" : "simulados"
          }`}
          icon={Sparkles}
        />
      </div>

      <p className="text-muted text-center text-xs">
        {formatResetCountdown()} · {formatResetDate()}
      </p>
    </section>
  );
}
