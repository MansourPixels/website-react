import { cn } from "@heroui/react";

import { UserIdentity } from "@/components/UserIdentity";
import type { RankingEntry } from "@/types/api/ranking";
import { formatPosition, formatXp } from "@/utils/ranking";

interface RankingRowProps {
  entry: RankingEntry;
  /**
   * Desligado só na landing, onde as linhas são demonstração e levariam o
   * visitante deslogado para uma rota privada.
   */
  linkToProfile?: boolean;
}

/**
 * As três primeiras posições ganham cor; da quarta em diante — e para quem
 * ainda não pontuou (`position: null`) — o número fica neutro, para o pódio
 * não competir com a linha do próprio usuário.
 */
function positionClass(position: number | null): string {
  if (position === 1) return "bg-warning-soft text-warning";
  if (position === 2) return "bg-default text-foreground";
  if (position === 3) return "bg-accent-soft text-accent";

  return "text-muted";
}

export function RankingRow({ entry, linkToProfile = true }: RankingRowProps) {
  return (
    <li
      className={cn(
        "bg-surface shadow-surface flex items-center gap-3 rounded-xl border-2 p-3",
        entry.isCurrentUser ? "border-accent" : "border-transparent",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
          positionClass(entry.position),
        )}
      >
        {formatPosition(entry.position)}
      </span>

      <UserIdentity
        user={entry.user}
        size="sm"
        linkToProfile={linkToProfile}
        caption={
          <span className="tabular-nums">
            {entry.flashcards} flash cards · {entry.quizzes}{" "}
            {entry.quizzes === 1 ? "simulado" : "simulados"}
          </span>
        }
        className="flex-1"
      />

      <strong className="shrink-0 text-sm font-semibold tabular-nums">
        {formatXp(entry.xp)}
      </strong>

      <span className="sr-only">
        {entry.position === null
          ? "Ainda não pontuou nesta temporada"
          : `${entry.position}º lugar`}
        {entry.isCurrentUser ? ", esta é a sua posição" : ""}
      </span>
    </li>
  );
}
