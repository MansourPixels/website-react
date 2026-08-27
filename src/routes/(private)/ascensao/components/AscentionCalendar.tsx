import { ApiError } from "@/api/client";
import { getStreakCalendar } from "@/api/streak";
import type { StreakDayStatus } from "@/types/api/streak";
import { cn } from "@heroui/react";
import { ChevronLeft, ChevronRight, Flame, Snowflake } from "lucide-react";
import { useEffect, useState } from "react";

const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTH_LABELS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const statusStyles: Record<StreakDayStatus, string> = {
  GOLD: "bg-accent text-accent-foreground",
  PARTIAL: "bg-accent-soft text-accent",
  FROZEN: "bg-sky-100 text-sky-500",
  NONE: "bg-zinc-100 text-zinc-400",
};

function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function isCurrentOrFutureMonth(year: number, month: number) {
  const now = new Date();

  return (
    year > now.getFullYear() ||
    (year === now.getFullYear() && month > now.getMonth() + 1)
  );
}

export function AscentionCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [statusByDate, setStatusByDate] = useState<Map<string, StreakDayStatus>>(
    new Map(),
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoadError(null);

    getStreakCalendar(monthKey(year, month))
      .then((result) => {
        if (cancelled) return;

        setStatusByDate(new Map(result.map((day) => [day.date, day.status])));
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        setLoadError(
          error instanceof ApiError
            ? error.detail
            : "Não foi possível carregar o calendário.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [year, month]);

  function goToPreviousMonth() {
    if (month === 1) {
      setYear((current) => current - 1);
      setMonth(12);
    } else {
      setMonth((current) => current - 1);
    }
  }

  const isNextDisabled = isCurrentOrFutureMonth(year, month);

  function goToNextMonth() {
    if (isNextDisabled) return;

    if (month === 12) {
      setYear((current) => current + 1);
      setMonth(1);
    } else {
      setMonth((current) => current + 1);
    }
  }

  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Mês anterior"
          className="size-8 rounded-full flex items-center justify-center hover:bg-background"
          onClick={goToPreviousMonth}
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="font-medium text-sm">
          {MONTH_LABELS[month - 1]} de {year}
        </span>
        <button
          type="button"
          aria-label="Próximo mês"
          disabled={isNextDisabled}
          className="size-8 rounded-full flex items-center justify-center hover:bg-background disabled:opacity-30 disabled:hover:bg-transparent"
          onClick={goToNextMonth}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {loadError !== null ? (
        <p className="text-danger text-sm text-center">{loadError}</p>
      ) : (
        <div className="grid grid-cols-7 gap-1 place-items-center">
          {WEEKDAY_LABELS.map((label, index) => (
            <span key={index} className="text-xs text-muted">
              {label}
            </span>
          ))}

          {Array.from({ length: firstWeekday }, (_, index) => (
            <span key={`blank-${index}`} />
          ))}

          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const date = `${monthKey(year, month)}-${String(day).padStart(2, "0")}`;
            const status = statusByDate.get(date) ?? null;

            return (
              <span
                key={date}
                aria-label={`Dia ${day}: ${status ?? "sem dados ainda"}`}
                className={cn(
                  "size-8 rounded-full flex items-center justify-center text-xs tabular-nums",
                  status !== null ? statusStyles[status] : "text-muted",
                )}
              >
                {status === "FROZEN" ? (
                  <Snowflake className="size-3.5" />
                ) : status === "GOLD" ? (
                  <Flame className="size-3.5" />
                ) : (
                  day
                )}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
