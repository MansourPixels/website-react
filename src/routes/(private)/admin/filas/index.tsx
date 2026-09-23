import { Button, cn, Tabs } from "@heroui/react";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router";

import { listDeadLetterQueues, listFailures } from "@/api/admin";
import { AdminBlock } from "@/components/admin/AdminBlock";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DeadLetterPanel } from "@/components/admin/DeadLetterPanel";
import { DeadLetterQueueList } from "@/components/admin/DeadLetterQueueList";
import { FailureList } from "@/components/admin/FailureList";
import { useAdminResource } from "@/hooks/useAdminResource";
import type { FailureSource } from "@/types/api/admin";
import { countOf } from "@/utils/adminFormat";
import { type QueuesSearch, queuesSearchFromUrl, queuesSearchToUrl } from "@/utils/adminQueues";
import { pageCount } from "@/utils/adminUsers";
import { pageMeta } from "@/utils/pageMeta";

export function meta() {
  return pageMeta({
    title: "Filas e falhas · Administração",
    description: "Trabalhos que falharam de vez: filas mortas para reenviar ou descartar, e falhas registradas.",
  });
}

const FAILURES_PAGE_SIZE = 20;

const SOURCES: { value: FailureSource | null; label: string }[] = [
  { value: null, label: "Todas" },
  { value: "categorization", label: "Categorização" },
  { value: "classroom-processing", label: "Turma" },
];

export default function AdminQueuesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = queuesSearchFromUrl(searchParams);
  // Sem atualização automática, para não pesar no broker: só pelo botão e depois de cada ação.
  const [refresh, setRefresh] = useState(0);

  const go = (next: Partial<QueuesSearch>) => setSearchParams(queuesSearchToUrl({ ...search, ...next }));

  return (
    <>
      <AdminPageHeader
        title="Filas e falhas"
        description="Trabalhos que falharam de vez: reenvie depois de corrigir a causa, ou descarte o que não faz mais sentido."
        actions={
          <Button size="sm" variant="secondary" onPress={() => setRefresh((value) => value + 1)}>
            <RefreshCw className="size-4" aria-hidden />
            Atualizar
          </Button>
        }
      />

      <Tabs
        selectedKey={search.tab}
        onSelectionChange={(key) => go({ tab: key === "falhas" ? "falhas" : "filas", queue: null, source: null, page: 1 })}
      >
        <Tabs.ListContainer>
          <Tabs.List aria-label="Filas mortas e falhas registradas">
            <Tabs.Tab id="filas">
              Filas mortas
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="falhas">
              Falhas registradas
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="filas" className="pt-4">
          <DeadLettersTab
            selected={search.queue}
            refresh={refresh}
            onSelect={(queue) => go({ queue })}
            onChanged={() => setRefresh((value) => value + 1)}
          />
        </Tabs.Panel>

        <Tabs.Panel id="falhas" className="pt-4">
          <FailuresTab
            source={search.source}
            page={search.page}
            refresh={refresh}
            onSource={(source) => go({ source, page: 1 })}
            onPage={(page) => go({ page })}
          />
        </Tabs.Panel>
      </Tabs>
    </>
  );
}

function DeadLettersTab({
  selected,
  refresh,
  onSelect,
  onChanged,
}: {
  selected: string | null;
  refresh: number;
  onSelect: (queue: string | null) => void;
  onChanged: () => void;
}) {
  const [queues, retryQueues] = useAdminResource(
    (signal) => listDeadLetterQueues(signal),
    "Não foi possível carregar as filas mortas.",
    String(refresh),
  );

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:items-start">
      {/* No celular, a fila aberta ocupa a tela; a lista volta pelo "Voltar para as filas". */}
      <div className={cn(selected !== null && "hidden md:block")}>
        <AdminBlock resource={queues} onRetry={retryQueues}>
          {(value) => <DeadLetterQueueList queues={value.queues} selected={selected} onSelect={onSelect} />}
        </AdminBlock>
      </div>

      {selected !== null ? (
        <DeadLetterPanel
          name={selected}
          queue={queues.state === "ready" ? queues.value.queues.find((queue) => queue.name === selected) : undefined}
          refresh={refresh}
          onClose={() => onSelect(null)}
          onChanged={onChanged}
        />
      ) : (
        <p className="hidden rounded-2xl bg-surface p-4 text-sm text-muted shadow-surface md:block">
          Escolha uma fila para ver as mensagens e reenviar ou descartar.
        </p>
      )}
    </div>
  );
}

function FailuresTab({
  source,
  page,
  refresh,
  onSource,
  onPage,
}: {
  source: FailureSource | null;
  page: number;
  refresh: number;
  onSource: (source: FailureSource | null) => void;
  onPage: (page: number) => void;
}) {
  const [failures, retryFailures] = useAdminResource(
    (signal) => listFailures({ source: source ?? undefined, page: page - 1, size: FAILURES_PAGE_SIZE }, signal),
    "Não foi possível carregar as falhas registradas.",
    `${source}|${page}|${refresh}`,
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Origem">
        {SOURCES.map((option) => (
          <Button
            key={option.label}
            size="sm"
            variant={source === option.value ? "primary" : "secondary"}
            aria-pressed={source === option.value}
            onPress={() => onSource(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <section className="flex flex-col gap-3 rounded-2xl bg-surface p-4 shadow-surface">
        <AdminBlock resource={failures} onRetry={retryFailures}>
          {(value) => {
            const pages = pageCount(value.total, value.size);

            if (value.failures.length === 0) {
              return value.total > 0 ? (
                <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
                  Esta página não existe mais.
                  <Button size="sm" variant="secondary" onPress={() => onPage(1)}>
                    Voltar para a primeira página
                  </Button>
                </p>
              ) : (
                <p className="text-sm text-muted">Nenhuma falha registrada.</p>
              );
            }

            return (
              <>
                <p className="text-sm text-muted" aria-live="polite">
                  {countOf(value.total, "falha registrada", "falhas registradas")}, mais recentes primeiro.
                </p>
                <FailureList failures={value.failures} />
                {pages > 1 ? (
                  <nav aria-label="Páginas" className="flex items-center justify-between gap-2">
                    <Button size="sm" variant="secondary" isDisabled={page <= 1} onPress={() => onPage(page - 1)}>
                      Anterior
                    </Button>
                    <span className="text-sm text-muted tabular-nums">
                      Página {Math.min(page, pages)} de {pages}
                    </span>
                    <Button size="sm" variant="secondary" isDisabled={page >= pages} onPress={() => onPage(page + 1)}>
                      Próxima
                    </Button>
                  </nav>
                ) : null}
              </>
            );
          }}
        </AdminBlock>
      </section>
    </div>
  );
}
