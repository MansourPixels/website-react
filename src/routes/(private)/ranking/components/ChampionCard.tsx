import { Crown } from "lucide-react";

import { UserIdentity } from "@/components/UserIdentity";
import type { SeasonChampion } from "@/types/api/ranking";
import { formatSeasonLabel, formatXp } from "@/utils/ranking";

interface ChampionCardProps {
  champion: SeasonChampion;
}

export function ChampionCard({ champion }: ChampionCardProps) {
  return (
    <section className="bg-surface shadow-surface flex items-center gap-4 rounded-2xl p-4">
      <span
        aria-hidden="true"
        className="bg-warning-soft text-warning flex size-9 shrink-0 items-center justify-center rounded-xl"
      >
        <Crown className="size-5" />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h2 className="text-muted text-xs">
          Campeão de {formatSeasonLabel(champion.seasonId)}
        </h2>
        <UserIdentity
          user={champion.user}
          size="sm"
          linkToProfile
          caption={
            <span className="tabular-nums">{formatXp(champion.xp)}</span>
          }
        />
      </div>
    </section>
  );
}
