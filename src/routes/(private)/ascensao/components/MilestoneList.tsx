import { milestones } from "@/utils/milestones";
import { Meter } from "@heroui/react";
import { CircleCheckBig, Flame } from "lucide-react";

interface MilestoneListProps {
  currentStreak: number;
}

export function MilestoneList({ currentStreak }: MilestoneListProps) {
  return (
    <section className="bg-surface rounded-3xl shadow-surface p-4 flex flex-col gap-4">
      <h2 className="font-semibold">Metas de ascensão</h2>

      <ul className="flex flex-col gap-4">
        {milestones.map(({ title, description, goal }) => {
          const isReached = currentStreak >= goal;
          const remaining = goal - currentStreak;

          return (
            <li key={title} className="flex items-center gap-3">
              <span
                className={
                  isReached ? "text-success shrink-0" : "text-muted shrink-0"
                }
              >
                {isReached ? (
                  <CircleCheckBig className="size-6" />
                ) : (
                  <Flame className="size-6" />
                )}
              </span>

              <div className="flex-1 grid grid-cols-[4.5rem_1fr_4.5rem] items-center gap-x-3 gap-y-1">
                <h3 className="text-sm font-medium text-pretty">{title}</h3>
                <Meter
                  value={Math.min(currentStreak, goal)}
                  maxValue={goal}
                  color={isReached ? "success" : "accent"}
                  aria-label={`Progresso da meta ${title}`}
                >
                  <Meter.Track>
                    <Meter.Fill />
                  </Meter.Track>
                </Meter>
                <span className="text-xs text-muted tabular-nums text-right">
                  {Math.min(currentStreak, goal)}/{goal}
                </span>
                <p className="col-span-3 text-sm text-muted text-pretty">
                  {isReached
                    ? "Conquistada"
                    : `Faltam ${remaining} ${remaining === 1 ? "dia" : "dias"} · ${description}`}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
