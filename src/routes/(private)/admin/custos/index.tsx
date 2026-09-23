import { useSearchParams } from "react-router";

import { getTopUsers, getUsageBreakdown, getUsageSummary } from "@/api/admin";
import { AdminBlock } from "@/components/admin/AdminBlock";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DailyCostChart } from "@/components/admin/DailyCostChart";
import { ExchangeRateNote } from "@/components/admin/ExchangeRateNote";
import { PeriodPicker } from "@/components/admin/PeriodPicker";
import { TopUsersList } from "@/components/admin/TopUsersList";
import { UsageBreakdownList } from "@/components/admin/UsageBreakdownList";
import { UsageTotalsGrid } from "@/components/admin/UsageTotalsGrid";
import { useAdminResource } from "@/hooks/useAdminResource";
import type { UsageDimension } from "@/types/api/admin";
import { saoPauloDay } from "@/utils/adminDates";
import { featureLabel, outcomeLabel, triggerLabel } from "@/utils/adminLabels";
import { periodFromSearch, periodToApi, periodToSearch } from "@/utils/adminPeriod";
import { pageMeta } from "@/utils/pageMeta";

export function meta() {
  return pageMeta({
    title: "Custos · Administração",
    description: "Quanto a IA está custando, com o quê e por quem.",
  });
}

const TOP_USERS = 20;

const BREAKDOWNS: { by: UsageDimension; title: string; label: (key: string | null) => string }[] = [
  { by: "feature", title: "Por funcionalidade", label: featureLabel },
  { by: "model", title: "Por modelo", label: (key) => key ?? "—" },
  { by: "trigger", title: "Por gatilho", label: triggerLabel },
  { by: "outcome", title: "Por resultado", label: outcomeLabel },
];

export default function AdminCostsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const period = periodFromSearch(searchParams);
  const today = saoPauloDay();
  const api = periodToApi(period, today);
  const key = `${api.from}..${api.to}`;
  const search = periodToSearch(period).toString();

  const [summary, retrySummary] = useAdminResource(
    (signal) => getUsageSummary(api, signal),
    "Não foi possível carregar os totais.",
    key,
  );
  const [days, retryDays] = useAdminResource(
    (signal) => getUsageBreakdown(api, "day", signal),
    "Não foi possível carregar o custo por dia.",
    key,
  );
  const [top, retryTop] = useAdminResource(
    (signal) => getTopUsers(api, TOP_USERS, signal),
    "Não foi possível carregar os usuários.",
    key,
  );
  const rate = summary.state === "ready" ? summary.value.usdBrlRate : top.state === "ready" ? top.value.usdBrlRate : null;

  return (
    <>
      <AdminPageHeader title="Custos" description="Quanto a IA está custando, com o quê e por quem." />

      <PeriodPicker value={period} today={today} onChange={(next) => setSearchParams(periodToSearch(next))} />

      <AdminBlock resource={summary} onRetry={retrySummary}>
        {(value) =>
          value.calls === 0 ? (
            <p className="rounded-2xl bg-surface p-4 text-muted shadow-surface">
              Nenhuma chamada de IA no período. Escolha outro período para ver o custo.
            </p>
          ) : (
            <UsageTotalsGrid summary={value} />
          )
        }
      </AdminBlock>

      <section className="flex flex-col gap-3 rounded-2xl bg-surface p-4 shadow-surface">
        <h2 className="font-semibold">Custo por dia</h2>
        <AdminBlock resource={days} onRetry={retryDays}>
          {(value) => <DailyCostChart days={value.groups} usdBrlRate={rate ?? 0} />}
        </AdminBlock>
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        {BREAKDOWNS.map((breakdown) => (
          <BreakdownBlock key={breakdown.by} {...breakdown} api={api} periodKey={key} rate={rate} />
        ))}
      </div>

      <section className="flex flex-col gap-3 rounded-2xl bg-surface p-4 shadow-surface">
        <h2 className="font-semibold">Usuários que mais custaram</h2>
        <AdminBlock resource={top} onRetry={retryTop}>
          {(value) => <TopUsersList top={value} detailSearch={search} />}
        </AdminBlock>
      </section>

      {rate !== null ? <ExchangeRateNote usdBrlRate={rate} /> : null}
    </>
  );
}

function BreakdownBlock({
  by,
  title,
  label,
  api,
  periodKey,
  rate,
}: {
  by: UsageDimension;
  title: string;
  label: (key: string | null) => string;
  api: { from: string; to: string };
  periodKey: string;
  rate: number | null;
}) {
  const [breakdown, retry] = useAdminResource(
    (signal) => getUsageBreakdown(api, by, signal),
    `Não foi possível carregar a divisão "${title.toLowerCase()}".`,
    periodKey,
  );

  return (
    <AdminBlock resource={breakdown} onRetry={retry}>
      {(value) => <UsageBreakdownList title={title} groups={value.groups} usdBrlRate={rate ?? 0} label={label} />}
    </AdminBlock>
  );
}
