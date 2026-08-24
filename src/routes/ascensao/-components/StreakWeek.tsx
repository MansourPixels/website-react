import type { AscensionDay, AscensionDayState } from "@/mocks/ascension";
import { cn } from "@heroui/react";
import { Check, Flame, Minus } from "lucide-react";

const dayStyles: Record<AscensionDayState, string> = {
  done: "bg-accent text-accent-foreground",
  today: "bg-accent-soft text-accent border-2 border-accent",
  missed: "bg-zinc-100 text-zinc-400",
  future: "bg-zinc-100 text-zinc-300",
};

const dayIcons: Record<AscensionDayState, typeof Check> = {
  done: Check,
  today: Flame,
  missed: Minus,
  future: Minus,
};

const dayDescriptions: Record<AscensionDayState, string> = {
  done: "estudou",
  today: "hoje",
  missed: "sem estudo",
  future: "ainda por vir",
};

interface StreakWeekProps {
  week: AscensionDay[];
}

export function StreakWeek({ week }: StreakWeekProps) {
  return (
    <section className="bg-white rounded-3xl p-4 flex flex-col gap-3">
      <h2 className="font-semibold">Semana atual</h2>
      <ul className="flex items-center justify-between gap-1">
        {week.map(({ label, state }) => {
          const Icon = dayIcons[state];

          return (
            <li key={label} className="flex flex-col items-center gap-2">
              <span
                aria-hidden
                className={cn(
                  "size-10 md:size-12 rounded-full flex items-center justify-center",
                  dayStyles[state],
                )}
              >
                <Icon className="size-5" />
              </span>
              <span className="text-xs text-muted">
                {label}
                <span className="sr-only">: {dayDescriptions[state]}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
