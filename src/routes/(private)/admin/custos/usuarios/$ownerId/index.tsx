import { buttonVariants } from "@heroui/styles";
import { ArrowLeft, UserCog } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router";

import { getTopUsers, getUserUsage } from "@/api/admin";
import { AdminBlock } from "@/components/admin/AdminBlock";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DailyCostChart } from "@/components/admin/DailyCostChart";
import { ExchangeRateNote } from "@/components/admin/ExchangeRateNote";
import { PeriodPicker } from "@/components/admin/PeriodPicker";
import { UsageBreakdownList } from "@/components/admin/UsageBreakdownList";
import { UsageTotalsGrid } from "@/components/admin/UsageTotalsGrid";
import { useAdminResource } from "@/hooks/useAdminResource";
import { saoPauloDay } from "@/utils/adminDates";
import { featureLabel } from "@/utils/adminLabels";
import { periodFromSearch, periodToApi, periodToSearch } from "@/utils/adminPeriod";
import { pageMeta } from "@/utils/pageMeta";

export function meta() {
  return pageMeta({ title: "Uso do usuário · Administração", description: "O custo de IA de um usuário." });
}

export default function AdminUserUsagePage() {
  const { ownerId = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const period = periodFromSearch(searchParams);
  const today = saoPauloDay();
  const api = periodToApi(period, today);
  const key = `${ownerId}:${api.from}..${api.to}`;

  const [usage, retry] = useAdminResource(
    (signal) => getUserUsage(ownerId, api, signal),
    "Não foi possível carregar o uso deste usuário.",
    key,
  );
  // O nome vem da lista dos que mais custaram; um usuário fora dela fica sem nome aqui.
  const [top] = useAdminResource((signal) => getTopUsers(api, 100, signal), "", key);
  const known = top.state === "ready" ? top.value.users.find((user) => user.ownerId === ownerId) : undefined;
  const name = known?.username ?? "Usuário";

  return (
    <>
      <Link to={`/admin/custos?${periodToSearch(period).toString()}`} className={buttonVariants({ variant: "ghost", size: "sm", className: "self-start" })}>
        <ArrowLeft className="size-4" aria-hidden />
        Custos
      </Link>

      <AdminPageHeader
        title={name}
        description={known?.email ?? ownerId}
        actions={
          known?.username ? (
            <Link
              to={`/admin/usuarios?busca=${encodeURIComponent(known.username)}`}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              <UserCog className="size-4" aria-hidden />
              Gerenciar usuário
            </Link>
          ) : null
        }
      />

      <PeriodPicker value={period} today={today} onChange={(next) => setSearchParams(periodToSearch(next))} />

      <AdminBlock resource={usage} onRetry={retry}>
        {(value) => (
          <>
            <UsageTotalsGrid summary={value.summary} showUsers={false} />
            <section className="flex flex-col gap-3 rounded-2xl bg-surface p-4 shadow-surface">
              <h2 className="font-semibold">Custo por dia</h2>
              <DailyCostChart days={value.byDay} usdBrlRate={value.summary.usdBrlRate} />
            </section>
            <UsageBreakdownList
              title="Por funcionalidade"
              groups={value.byFeature}
              usdBrlRate={value.summary.usdBrlRate}
              label={featureLabel}
            />
            <ExchangeRateNote usdBrlRate={value.summary.usdBrlRate} />
          </>
        )}
      </AdminBlock>
    </>
  );
}
