import type { UsageGroup } from "@/types/api/admin";
import { countOf, formatMoney } from "@/utils/adminFormat";
import { barScale } from "@/utils/barScale";

const HEIGHT = 160;

function dayLabel(day: string): string {
  const [, month, date] = day.split("-");

  return `${date}/${month}`;
}

/**
 * O custo de cada dia do período em barras, sem biblioteca de gráficos. Cada
 * barra recebe foco pelo teclado e mostra o valor e as chamadas ao receber foco
 * ou o ponteiro. Dias sem uso aparecem com barra zero (a API já os devolve).
 */
export function DailyCostChart({ days, usdBrlRate }: { days: UsageGroup[]; usdBrlRate: number }) {
  const heights = barScale(days.map((day) => day.costUsd), HEIGHT);
  const max = Math.max(0, ...days.map((day) => day.costUsd));
  const labelEvery = Math.max(1, Math.ceil(days.length / 8));

  return (
    <figure className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="flex flex-col justify-between text-[0.6875rem] text-muted tabular-nums" style={{ height: HEIGHT }} aria-hidden>
          <span>{formatMoney(max, usdBrlRate).brl}</span>
          <span>{formatMoney(max / 2, usdBrlRate).brl}</span>
          <span>{formatMoney(0, usdBrlRate).brl}</span>
        </div>
        <ol className="flex flex-1 items-end gap-[2px] border-b border-l px-1" style={{ height: HEIGHT }}>
          {days.map((day, index) => {
            const money = formatMoney(day.costUsd, usdBrlRate);
            const description = `${dayLabel(day.key ?? "")}: ${money.brl} (${money.usd}), ${countOf(day.calls, "chamada", "chamadas")}`;

            return (
              <li key={day.key ?? index} className="group relative flex h-full flex-1 items-end">
                <div
                  tabIndex={0}
                  aria-label={description}
                  className="w-full rounded-t bg-accent outline-none transition-opacity group-hover:opacity-80 focus-visible:ring-2 focus-visible:ring-focus"
                  style={{ height: Math.max(heights[index], day.costUsd > 0 ? 2 : 0) || 1, opacity: day.costUsd > 0 ? 1 : 0.2 }}
                />
                <span
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-2 py-1 text-xs text-background group-hover:block group-focus-within:block"
                >
                  {description}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <ol className="ml-10 flex h-4 gap-[2px] px-1 text-[0.6875rem] text-muted" aria-hidden>
        {days.map((day, index) => (
          <li key={day.key ?? index} className="relative flex-1">
            {index % labelEvery === 0 ? (
              <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap">{dayLabel(day.key ?? "")}</span>
            ) : null}
          </li>
        ))}
      </ol>
      <figcaption className="sr-only">Custo por dia no período.</figcaption>
    </figure>
  );
}
