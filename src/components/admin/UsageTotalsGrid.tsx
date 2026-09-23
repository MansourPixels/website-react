import { AlertTriangle, Coins, Mic, PhoneCall, UserRound, Users } from "lucide-react";

import { StatTile } from "@/components/StatTile";
import type { UsageSummary } from "@/types/api/admin";
import { formatCount, formatMoney } from "@/utils/adminFormat";

/** Os totais de um período: custo, chamadas, minutos de áudio, usuários e custo por usuário. */
export function UsageTotalsGrid({ summary, showUsers = true }: { summary: UsageSummary; showUsers?: boolean }) {
  const money = formatMoney(summary.costUsd, summary.usdBrlRate);
  const perUser =
    summary.distinctUsers === 0 ? null : formatMoney(summary.costUsd / summary.distinctUsers, summary.usdBrlRate);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile label="Custo" value={money.brl} hint={money.usd} icon={Coins} />
        <StatTile
          label="Chamadas"
          value={formatCount(summary.calls)}
          hint={summary.failedCalls > 0 ? `${formatCount(summary.failedCalls)} com falha` : "Nenhuma falha"}
          icon={PhoneCall}
        />
        <StatTile label="Minutos de áudio" value={formatCount(Math.round(summary.audioMinutes))} icon={Mic} />
        {showUsers ? (
          <>
            <StatTile label="Usuários com custo" value={formatCount(summary.distinctUsers)} icon={Users} />
            <StatTile
              label="Custo por usuário"
              value={perUser === null ? "—" : perUser.brl}
              hint={perUser === null ? undefined : perUser.usd}
              icon={UserRound}
            />
          </>
        ) : null}
      </div>

      {summary.unpricedCalls > 0 ? (
        <p role="status" className="flex items-start gap-2 rounded-xl bg-warning-soft p-3 text-sm text-warning-soft-foreground">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" aria-hidden />
          {summary.unpricedCalls === 1
            ? "1 chamada não tem preço configurado e não entrou no custo."
            : `${formatCount(summary.unpricedCalls)} chamadas não têm preço configurado e não entraram no custo.`}{" "}
          Confira a tabela de preços do servidor.
        </p>
      ) : null}
    </div>
  );
}
