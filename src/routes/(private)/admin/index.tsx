import { Spinner } from "@heroui/react";
import { Coins, Inbox, Scale, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AdminForbiddenError, getUsageSummary, listDeadLetterQueues } from "@/api/admin";
import { ApiError } from "@/api/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminShortcutCard } from "@/components/admin/AdminShortcutCard";
import { ErrorState } from "@/components/ErrorState";
import type { UsageSummary } from "@/types/api/admin";
import { formatMoney } from "@/utils/adminFormat";
import { saoPauloDay } from "@/utils/adminDates";
import { pageMeta } from "@/utils/pageMeta";

export function meta() {
  return pageMeta({
    title: "Administração",
    description: "Custos, usuários e falhas da plataforma.",
  });
}

type Load<T> = { state: "loading" } | { state: "ready"; value: T } | { state: "error"; message: string };

function messageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.detail : fallback;
}

/**
 * Carrega um bloco da página sem depender dos outros: a falha de um cartão não
 * apaga os demais. Um `403` não vira erro aqui, porque o layout já troca a
 * página inteira por "Acesso restrito". `retry` volta ao estado de carregamento
 * e busca de novo.
 */
function useBlock<T>(load: (signal: AbortSignal) => Promise<T>, fallback: string): [Load<T>, () => void] {
  const [block, setBlock] = useState<Load<T>>({ state: "loading" });
  const [attempt, setAttempt] = useState(0);
  // O carregador é recriado a cada render; a ref deixa o efeito depender só da tentativa.
  const loader = useRef({ load, fallback });

  // Declarado antes do efeito de carga: os efeitos rodam na ordem, então a carga
  // sempre usa o carregador do render mais recente.
  useEffect(() => {
    loader.current = { load, fallback };
  });

  useEffect(() => {
    const controller = new AbortController();

    loader.current
      .load(controller.signal)
      .then((value) => setBlock({ state: "ready", value }))
      .catch((error) => {
        if (controller.signal.aborted || error instanceof AdminForbiddenError) return;
        setBlock({ state: "error", message: messageOf(error, loader.current.fallback) });
      });

    return () => controller.abort();
  }, [attempt]);

  const retry = () => {
    setBlock({ state: "loading" });
    setAttempt((value) => value + 1);
  };

  return [block, retry];
}

export default function AdminHomePage() {
  const today = saoPauloDay();

  const [todayCost, retryToday] = useBlock(
    (signal) => getUsageSummary({ from: today, to: today }, signal),
    "Não foi possível carregar o custo de hoje.",
  );
  const [monthCost, retryMonth] = useBlock(
    (signal) => getUsageSummary({}, signal),
    "Não foi possível carregar o custo dos últimos 30 dias.",
  );
  const [queues, retryQueues] = useBlock(
    (signal) => listDeadLetterQueues(signal),
    "Não foi possível consultar as filas.",
  );

  return (
    <>
      <AdminPageHeader
        title="Administração"
        description="Um resumo do que a plataforma está gastando e do que falhou."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <AdminShortcutCard
          to="/admin/custos"
          title="Custos"
          description="Quanto a IA está custando, com o quê e por quem."
          icon={Coins}
        >
          {todayCost.state === "error" || monthCost.state === "error" ? (
            <ErrorState
              isCompact
              onRetry={() => {
                retryToday();
                retryMonth();
              }}
            >
              {todayCost.state === "error" ? todayCost.message : (monthCost as { message: string }).message}
            </ErrorState>
          ) : todayCost.state === "loading" || monthCost.state === "loading" ? (
            <Spinner size="sm" />
          ) : (
            <dl className="grid grid-cols-2 gap-2">
              <CostFigure label="Hoje" summary={todayCost.value} />
              <CostFigure label="Últimos 30 dias" summary={monthCost.value} />
            </dl>
          )}
        </AdminShortcutCard>

        <AdminShortcutCard
          to="/admin/filas"
          title="Filas e falhas"
          description="Trabalhos em segundo plano que falharam de vez."
          icon={Inbox}
        >
          {queues.state === "error" ? (
            <ErrorState isCompact onRetry={retryQueues}>
              {queues.message}
            </ErrorState>
          ) : queues.state === "loading" ? (
            <Spinner size="sm" />
          ) : (
            <QueueFigure withMessages={queues.value.queues.filter((queue) => queue.messages > 0).length} />
          )}
        </AdminShortcutCard>

        <AdminShortcutCard
          to="/admin/usuarios"
          title="Usuários"
          description="Busque contas, veja o custo de cada uma e desative quem abusa."
          icon={Users}
        />

        <AdminShortcutCard
          to="/admin/cotas"
          title="Cotas e planos"
          description="Limites de uso por plano."
          icon={Scale}
        />
      </div>
    </>
  );
}

function CostFigure({ label, summary }: { label: string; summary: UsageSummary }) {
  const money = formatMoney(summary.costUsd, summary.usdBrlRate);

  return (
    <div className="flex flex-col">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="flex flex-col">
        <strong className="text-xl font-semibold tabular-nums">{money.brl}</strong>
        <span className="text-xs text-muted tabular-nums">{money.usd}</span>
      </dd>
    </div>
  );
}

function QueueFigure({ withMessages }: { withMessages: number }) {
  if (withMessages === 0) {
    return <p className="text-sm text-muted">Nenhuma fila morta com mensagens.</p>;
  }

  return (
    <p className="text-sm font-medium text-danger-soft-foreground">
      {withMessages === 1 ? "1 fila morta com mensagens." : `${withMessages} filas mortas com mensagens.`}
    </p>
  );
}
