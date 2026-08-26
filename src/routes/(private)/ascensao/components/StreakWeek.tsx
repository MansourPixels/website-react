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
    <section className="bg-white rounded-3xl shadow-surface p-4 flex flex-col gap-3">
      <h2 className="font-semibold">Semana atual</h2>
      <ul className="grid grid-cols-7 gap-1">
        {week.map(({ label, state }) => {
          const Icon = dayIcons[state];

          return (
            <li
              key={label}
              className="flex flex-col items-center gap-2 min-w-0"
            >
              <span
                aria-hidden
                className={cn(
                  "w-full max-w-10 md:max-w-12 aspect-square rounded-full flex items-center justify-center",
                  dayStyles[state],
                )}
              >
                <Icon className="size-4 sm:size-5" />
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
