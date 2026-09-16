import { ApiError } from "@/api/client";
import { getStreakCalendar } from "@/api/streak";
import { ErrorState } from "@/components/ErrorState";
import type { StreakDayStatus } from "@/types/api/streak";
import { Button, Spinner, cn } from "@heroui/react";
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

// Janela de navegação para trás: sem uma data de primeiro registro vinda do
// back, doze meses é o limite que cobre o histórico útil sem deixar o aluno
// paginar (e disparar um request) por meses que nunca existiram.
const CALENDAR_MONTH_SPAN = 12;

const statusStyles: Record<StreakDayStatus, string> = {
  GOLD: "bg-accent text-accent-foreground",
  PARTIAL: "bg-accent-soft text-accent-soft-foreground",
  FROZEN: "bg-default text-muted",
  NONE: "bg-default text-muted",
};

const statusLabels: Record<StreakDayStatus, string> = {
  GOLD: "dia de ouro",
  PARTIAL: "dia parcial",
  FROZEN: "dia congelado",
  NONE: "sem atividade",
};

function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function monthIndex(year: number, month: number) {
  return year * 12 + (month - 1);
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

  const [statusByDate, setStatusByDate] = useState<Map<
    string,
    StreakDayStatus
  > | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    // Sem limpar o mapa, o mês anterior continua desenhado enquanto o novo
    // carrega — e o mês novo estreia inteiro em cinza de "sem dados".
    setStatusByDate(null);
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
  }, [year, month, reloadKey]);

  const isPreviousDisabled =
    monthIndex(year, month) <=
    monthIndex(now.getFullYear(), now.getMonth() + 1) -
      (CALENDAR_MONTH_SPAN - 1);

  function goToPreviousMonth() {
    if (isPreviousDisabled) return;

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
        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          aria-label="Mês anterior"
          isDisabled={isPreviousDisabled}
          onPress={goToPreviousMonth}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="font-medium text-sm tabular-nums">
          {MONTH_LABELS[month - 1]} de {year}
        </span>
        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          aria-label="Próximo mês"
          isDisabled={isNextDisabled}
          onPress={goToNextMonth}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {loadError !== null ? (
        <ErrorState isCompact onRetry={() => setReloadKey((k) => k + 1)}>
          {loadError}
        </ErrorState>
      ) : statusByDate === null ? (
        <div className="flex items-center justify-center py-8" aria-busy="true">
          <Spinner />
          <span className="sr-only">Carregando calendário</span>
        </div>
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
                // Sem um papel explícito, o `aria-label` de um `span` genérico
                // não é exposto: a célula seria lida só como o numeral.
                role="img"
                aria-label={`Dia ${day}: ${status !== null ? statusLabels[status] : "sem dados ainda"}`}
                className={cn(
                  "relative size-8 rounded-full flex items-center justify-center text-xs tabular-nums",
                  status !== null ? statusStyles[status] : "text-muted",
                )}
              >
                {day}
                {status === "GOLD" || status === "FROZEN" ? (
                  <span
                    aria-hidden
                    className="absolute -top-1 -right-1 size-3 rounded-full bg-surface flex items-center justify-center"
                  >
                    {status === "GOLD" ? (
                      <Flame className="size-2.5 text-accent" />
                    ) : (
                      <Snowflake className="size-2.5 text-muted" />
                    )}
                  </span>
                ) : null}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
