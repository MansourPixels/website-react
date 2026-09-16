import { Button, Disclosure, Spinner } from "@heroui/react";
import { CalendarSync } from "lucide-react";
import { useEffect, useState } from "react";

import { ApiError } from "@/api/client";
import { listTasks, setTaskDone, setTaskSync } from "@/api/tasks";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { FABButton } from "@/components/FABButton";
import { NavMenu } from "@/components/NavMenu";
import { useGoogle } from "@/contexts/GoogleContext";
import type { Task } from "@/types/Task";
import { googleIssueMessage } from "@/utils/googleIssues";
import { publishTaskEvent } from "@/utils/taskCalendar";
import { isOverdue } from "@/utils/tasksStorage";
import { DialogFormTarefa } from "./components/DialogFormTarefa";
import { DialogTarefaExclusion } from "./components/DialogTarefaExclusion";
import { TarefaRow } from "./components/TarefaRow";

export default function TasksPage() {
  const google = useGoogle();

  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Separado do `loadError` de propósito: uma conclusão que falhou não pode
  // trocar a lista inteira por uma tela de erro.
  const [actionError, setActionError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  // Ids em voo para a Agenda: a linha mostra o spinner no lugar do selo, e o
  // botão de sincronizar em lote não dispara duas vezes.
  const [syncingIds, setSyncingIds] = useState<string[]>([]);

  // `Date.now()` no corpo do render é impuro — o mesmo render poderia
  // classificar a mesma tarefa de dois jeitos. O relógio entra pelo estado e
  // avança de minuto em minuto, que é a granularidade de "atrasada". Zero no
  // servidor: sem relógio, nada é declarado atrasado.
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());

    const intervalId = window.setInterval(() => setNow(Date.now()), 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let cancelled = false;

    setTasks(null);
    setLoadError(null);

    listTasks()
      .then((result) => {
        if (!cancelled) setTasks(result);
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        setLoadError(
          error instanceof ApiError
            ? error.detail
            : "Não foi possível carregar suas tarefas. Tente novamente.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function upsert(task: Task) {
    setTasks((current) => {
      if (current === null) return [task];

      const exists = current.some((item) => item.id === task.id);

      return exists
        ? current.map((item) => (item.id === task.id ? task : item))
        : [...current, task];
    });
  }

  const canSync = google.status === "connected" && google.hasCalendar;

  async function syncTask(task: Task) {
    if (!canSync) return;

    setSyncingIds((current) => [...current, task.id]);

    try {
      const eventId = await publishTaskEvent(task);

      upsert(
        await setTaskSync(
          task.id,
          eventId === null ? "falhou" : "sincronizada",
          eventId ?? task.googleEventId,
        ),
      );
    } catch {
      // A tarefa já está salva; só o registro do resultado falhou.
    } finally {
      setSyncingIds((current) => current.filter((id) => id !== task.id));
    }
  }

  function handleSubmitted(task: Task, addToCalendar: boolean) {
    upsert(task);

    if (addToCalendar) void syncTask(task);
  }

  async function handleToggleDone(task: Task, done: boolean) {
    setActionError(null);

    try {
      const updated = await setTaskDone(task.id, done);

      upsert(updated);

      // Só propaga para a Agenda o que já mora lá: concluir uma tarefa local
      // não é motivo para criar um evento que o aluno nunca pediu.
      if (updated.googleEventId !== null && canSync) void syncTask(updated);
    } catch {
      setActionError("Não foi possível atualizar a tarefa. Tente novamente.");
    }
  }

  function handleDeleted(task: Task) {
    setTasks((current) => current?.filter((item) => item.id !== task.id) ?? null);
    setDeletingTask(null);
  }

  const all = tasks ?? [];

  const overdue = all
    .filter((task) => isOverdue(task, now))
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const upcoming = all
    .filter((task) => !task.done && !isOverdue(task, now))
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const completed = all
    .filter((task) => task.done)
    .sort((a, b) =>
      (b.completedAt ?? b.dueAt).localeCompare(a.completedAt ?? a.dueAt),
    );

  const pendingSync = all.filter(
    (task) => !task.done && task.syncState !== "sincronizada",
  );

  const issueMessage = googleIssueMessage(google.issue);

  function renderRows(items: Task[]) {
    return (
      <ul className="flex flex-col gap-2">
        {items.map((task) => (
          <TarefaRow
            key={task.id}
            task={task}
            isOverdue={isOverdue(task, now)}
            canSync={canSync}
            isSyncing={syncingIds.includes(task.id)}
            onToggleDone={(item, done) => void handleToggleDone(item, done)}
            onEdit={setEditingTask}
            onDelete={setDeletingTask}
            onRetrySync={(item) => void syncTask(item)}
          />
        ))}
      </ul>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
      <NavMenu title="Tarefas" hasBackButton backHref="/trilha" />

      {tasks === null && loadError === null ? (
        <div
          className="flex flex-1 items-center justify-center p-6"
          aria-busy="true"
        >
          <Spinner size="lg" />
          <span className="sr-only">Carregando tarefas</span>
        </div>
      ) : loadError !== null ? (
        <ErrorState onRetry={() => setReloadKey((key) => key + 1)}>
          {loadError}
        </ErrorState>
      ) : all.length === 0 ? (
        <EmptyState
          action={
            <Button variant="secondary" onPress={() => setIsAddOpen(true)}>
              Marcar entrega
            </Button>
          }
        >
          Nenhuma entrega marcada. Anote a próxima prova ou trabalho e o Revi
          avisa antes do prazo.
        </EmptyState>
      ) : (
        <>
          {/* Escrever na agenda pessoal de alguém sozinho, sem pedir, não: o
              lote existe, mas só acontece por clique. */}
          {canSync && pendingSync.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-accent-soft p-4">
              <p className="text-accent-soft-foreground text-sm text-pretty">
                {pendingSync.length === 1
                  ? "Uma tarefa ainda não está na sua Google Agenda."
                  : `${pendingSync.length} tarefas ainda não estão na sua Google Agenda.`}
              </p>
              <Button
                variant="secondary"
                size="sm"
                isDisabled={syncingIds.length > 0}
                onPress={() => {
                  for (const task of pendingSync) void syncTask(task);
                }}
              >
                <CalendarSync className="size-4" />
                {pendingSync.length === 1
                  ? "Sincronizar com a Agenda"
                  : `Sincronizar ${pendingSync.length} tarefas`}
              </Button>
            </div>
          ) : null}

          {actionError !== null ? (
            <ErrorState isCompact>{actionError}</ErrorState>
          ) : null}

          {issueMessage !== null ? (
            <ErrorState isCompact>{issueMessage}</ErrorState>
          ) : null}

          {overdue.length > 0 ? (
            <section className="flex flex-col gap-3 rounded-3xl bg-surface p-4 shadow-surface">
              <h2 className="font-semibold">Atrasadas</h2>
              {renderRows(overdue)}
            </section>
          ) : null}

          <section className="flex flex-col gap-3 rounded-3xl bg-surface p-4 shadow-surface">
            <h2 className="font-semibold">Próximas</h2>
            {upcoming.length > 0 ? (
              renderRows(upcoming)
            ) : (
              <EmptyState isCompact>
                Nenhuma entrega pendente por aqui.
              </EmptyState>
            )}
          </section>

          {completed.length > 0 ? (
            <section className="rounded-3xl bg-surface p-4 shadow-surface">
              <Disclosure>
                <Disclosure.Heading>
                  <Disclosure.Trigger className="w-full justify-between">
                    <span className="font-semibold">
                      Concluídas ({completed.length})
                    </span>
                    <Disclosure.Indicator />
                  </Disclosure.Trigger>
                </Disclosure.Heading>
                <Disclosure.Content>
                  <Disclosure.Body>{renderRows(completed)}</Disclosure.Body>
                </Disclosure.Content>
              </Disclosure>
            </section>
          ) : null}
        </>
      )}

      {tasks !== null && loadError === null ? (
        <FABButton
          aria-label="Nova tarefa"
          className="bottom-[calc(var(--nav-inset)+1rem)]"
          onPress={() => setIsAddOpen(true)}
        />
      ) : null}

      <DialogFormTarefa
        variant="add"
        isOpen={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSubmit={handleSubmitted}
      />

      {editingTask !== null ? (
        <DialogFormTarefa
          variant="edit"
          task={editingTask}
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setEditingTask(null);
          }}
          onSubmit={handleSubmitted}
        />
      ) : null}

      {deletingTask !== null ? (
        <DialogTarefaExclusion
          task={deletingTask}
          canSync={canSync}
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setDeletingTask(null);
          }}
          onConfirm={handleDeleted}
        />
      ) : null}
    </main>
  );
}
