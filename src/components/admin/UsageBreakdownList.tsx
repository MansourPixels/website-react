import type { UsageGroup } from "@/types/api/admin";
import { countOf, formatCount, formatMoney } from "@/utils/adminFormat";
import { shares } from "@/utils/barScale";

interface UsageBreakdownListProps {
  title: string;
  groups: UsageGroup[];
  usdBrlRate: number;
  label: (key: string | null) => string;
}

/** Uma divisão do custo (por funcionalidade, modelo...) em barras horizontais com o percentual do total. */
export function UsageBreakdownList({ title, groups, usdBrlRate, label }: UsageBreakdownListProps) {
  const percents = shares(groups.map((group) => group.costUsd));

  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-surface p-4 shadow-surface">
      <h2 className="font-semibold">{title}</h2>
      {groups.length === 0 ? (
        <p className="text-sm text-muted">Sem uso no período.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {groups.map((group, index) => {
            const money = formatMoney(group.costUsd, usdBrlRate);

            return (
              <li key={group.key ?? `none-${index}`} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate">{label(group.key)}</span>
                  <span className="shrink-0 tabular-nums">
                    {money.brl} <span className="text-xs text-muted">· {percents[index]}%</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-default" aria-hidden>
                  <div className="h-2 rounded-full bg-accent" style={{ width: `${percents[index]}%` }} />
                </div>
                <span className="text-xs text-muted tabular-nums">
                  {money.usd} · {countOf(group.calls, "chamada", "chamadas")}
                  {group.failedCalls > 0 ? ` · ${formatCount(group.failedCalls)} com falha` : ""}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
