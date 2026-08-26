import type { StudyDay } from "@/mocks/performance";
import { formatDuration } from "@/utils/time";
import { cn, Meter } from "@heroui/react";

interface WeeklyStudyListProps {
  week: StudyDay[];
}

export function WeeklyStudyList({ week }: WeeklyStudyListProps) {
  const best = Math.max(...week.map((day) => day.minutes));
  const total = week.reduce((sum, day) => sum + day.minutes, 0);

  return (
    <section className="bg-white rounded-3xl shadow-surface p-4 flex flex-col gap-3">
      <header>
        <h2 className="font-semibold">Tempo de estudo na semana</h2>
        <p className="text-sm text-muted">
          {formatDuration(total)} no total · média de{" "}
          {formatDuration(Math.round(total / week.length))} por dia.
        </p>
      </header>

      <ul className="flex flex-col gap-3">
        {week.map(({ label, minutes }) => (
          <li
            key={label}
            className="grid grid-cols-[3rem_1fr_4.5rem] items-center gap-3"
          >
            <span className="text-sm text-muted">{label}</span>
            <Meter
              value={minutes}
              maxValue={best}
              aria-label={`${label}: ${formatDuration(minutes)}`}
            >
              <Meter.Track>
                <Meter.Fill />
              </Meter.Track>
            </Meter>
            <span
              className={cn(
                "text-sm text-right tabular-nums",
                minutes === best ? "font-semibold" : "text-muted",
              )}
            >
              {formatDuration(minutes)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
