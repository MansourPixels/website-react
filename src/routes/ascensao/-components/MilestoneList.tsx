import type { AscensionMilestone } from "@/mocks/ascension";
import { Meter } from "@heroui/react";
import { CircleCheckBig, Flame } from "lucide-react";

interface MilestoneListProps {
  milestones: AscensionMilestone[];
  currentStreak: number;
}

export function MilestoneList({
  milestones,
  currentStreak,
}: MilestoneListProps) {
  return (
    <section className="bg-white rounded-3xl p-4 flex flex-col gap-4">
      <h2 className="font-semibold">Metas de ascensão</h2>

      <ul className="flex flex-col gap-4">
        {milestones.map(({ title, description, goal }) => {
          const isReached = currentStreak >= goal;
          const remaining = goal - currentStreak;

          return (
            <li key={title} className="flex items-center gap-3">
              <span
                className={
                  isReached
                    ? "text-success shrink-0"
                    : "text-muted shrink-0 opacity-60"
                }
              >
                {isReached ? (
                  <CircleCheckBig className="size-6" />
                ) : (
                  <Flame className="size-6" />
                )}
              </span>

              <div className="flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-medium">{title}</h3>
                  <span className="text-xs text-muted tabular-nums">
                    {Math.min(currentStreak, goal)}/{goal}
                  </span>
                </div>
                <p className="text-sm text-muted">
                  {isReached
                    ? "Conquistada"
                    : `Faltam ${remaining} ${remaining === 1 ? "dia" : "dias"} · ${description}`}
                </p>
                <Meter
                  value={Math.min(currentStreak, goal)}
                  maxValue={goal}
                  color={isReached ? "success" : "accent"}
                  aria-label={`Progresso da meta ${title}`}
                  className="mt-1"
                >
                  <Meter.Track>
                    <Meter.Fill />
                  </Meter.Track>
                </Meter>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
