import { Button, Disclosure, Spinner } from "@heroui/react";
import { CalendarSync } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { listClassrooms } from "@/api/classrooms";
import { ApiError } from "@/api/client";
import { listTasks, requestTaskSync, setTaskDone } from "@/api/tasks";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { FABButton } from "@/components/FABButton";
import { NavMenu } from "@/components/NavMenu";
import { useGoogle } from "@/contexts/GoogleContext";
import type { ClassroomRole } from "@/types/api/classroom";
import type { Task } from "@/types/Task";
import { canManageClassroomTasks } from "@/utils/classroomPermissions";
import { googleIssueMessage } from "@/utils/googleIssues";
import { pageMeta } from "@/utils/pageMeta";
import { isOverdue } from "@/utils/tasks";
import { DialogFormTarefa } from "./components/DialogFormTarefa";
import { DialogTarefaExclusion } from "./components/DialogTarefaExclusion";
import { TarefaRow } from "./components/TarefaRow";

export function meta() {
  return pageMeta({
    title: "Tarefas",
    description:
      "As entregas e as provas que você anotou, com o que está mais perto de vencer no topo.",
  });
}

/**
 * A publicação na Agenda é assíncrona no servidor: toda mutação responde
 * `syncState: "local"` e o desfecho só aparece numa leitura posterior. Em vez de
 * inventar um "sincronizada" que talvez não tenha acontecido, esperamos a fila
 * assentar e relemos a lista — o selo que aparece é o que o servidor viu.
 */
const SYNC_SETTLE_MS = 2500;

export default function TasksPage() {
  const google = useGoogle();

  const [tasks, setTasks] = useState<Task[] | null>(null);
  // Só para saber quem pode editar a entrega da turma: a resposta de /api/tasks
  // traz o nome da turma, não o papel de quem está lendo.
  const [rolesByClassroom, setRolesByClassroom] = useState<
    Record<string, ClassroomRole>
  >({});
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
    const controller = new AbortController();

    setTasks(null);
    setLoadError(null);

    listTasks(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setTasks(result);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        setLoadError(
          error instanceof ApiError
            ? error.detail
            : "Não foi possível carregar suas tarefas. Tente novamente.",
        );
      });

    // As turmas são acessório: sem elas a lista aparece igual, só sem os botões
    // de editar a entrega da turma. Por isso a falha aqui é silenciosa.
    listClassrooms()
      .then((classrooms) => {
        if (controller.signal.aborted) return;

        setRolesByClassroom(
          Object.fromEntries(
            classrooms.map((classroom) => [classroom.id, classroom.role]),
          ),
        );
      })
      .catch(() => {
        // Sem papéis, nenhuma tarefa de turma oferece editar nem excluir.
      });

    return () => controller.abort();
  }, [reloadKey]);

  const settleTimeoutRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (settleTimeoutRef.current !== null) {
        window.clearTimeout(settleTimeoutRef.current);
      }
    },
    [],
  );

  /**
   * Relê a lista depois de a fila do servidor ter tido tempo de rodar. Silencioso
   * de propósito: a lista já está na tela e não pode piscar para "carregando" a
   * cada tarefa criada.
   */
  const settleSync = useCallback(() => {
    if (settleTimeoutRef.current !== null) {
      window.clearTimeout(settleTimeoutRef.current);
    }

    settleTimeoutRef.current = window.setTimeout(() => {
      settleTimeoutRef.current = null;

      listTasks()
        .then((result) => setTasks(result))
        .catch(() => {
          // A lista em tela continua válida; só o selo pode estar atrasado.
        })
        .finally(() => setSyncingIds([]));
    }, SYNC_SETTLE_MS);
  }, []);

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

  /**
   * Só reenfileira: o `202` diz que o pedido entrou na fila, não que o evento
   * existe. Quem conta o desfecho é o `settleSync`.
   */
  async function syncTasks(items: Task[]) {
    if (items.length === 0) return;

    setActionError(null);
    setSyncingIds((current) => [...current, ...items.map((item) => item.id)]);

    const results = await Promise.allSettled(
      items.map((item) => requestTaskSync(item.id)),
    );

    const rejection = results.find((result) => result.status === "rejected");

    if (rejection !== undefined && rejection.status === "rejected") {
      setActionError(
        rejection.reason instanceof ApiError
          ? rejection.reason.detail
          : "Não foi possível pedir a sincronização com a Agenda. Tente novamente.",
      );
    }

    settleSync();
  }

  function handleSubmitted(task: Task) {
    upsert(task);

    // O servidor publica sozinho ao criar e ao editar — não há o que pedir, só
    // o que reler quando a fila assentar.
    if (canSync) settleSync();
  }

  async function handleToggleDone(task: Task, done: boolean) {
    setActionError(null);

    try {
      upsert(await setTaskDone(task.id, done));

      // Concluir reescreve o resumo do evento ("✓ <título>"), então o selo pode
      // mudar — mas só para quem já tem a Agenda ligada.
      if (canSync) settleSync();
    } catch (error) {
      setActionError(
        error instanceof ApiError
          ? error.detail
          : "Não foi possível atualizar a tarefa. Tente novamente.",
      );
    }
  }

  function handleDeleted(task: Task) {
    setTasks((current) => current?.filter((item) => item.id !== task.id) ?? null);
    setDeletingTask(null);
  }

  /**
   * Tarefa pessoal é sempre de quem está lendo. A da turma depende do papel — e,
   * sem a lista de turmas, o benefício da dúvida é não oferecer o botão: o
   * servidor recusaria com `403` de qualquer forma.
   */
  function canManage(task: Task) {
    if (task.classroomId === null) return true;

    const role = rolesByClassroom[task.classroomId];

    return role !== undefined && canManageClassroomTasks(role);
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

  // Conectar o Google depois não sincroniza o passado: cada tarefa criada
  // enquanto a conta estava solta espera uma edição ou um pedido explícito.
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
            canManage={canManage(task)}
            isSyncing={syncingIds.includes(task.id)}
            onToggleDone={(item, done) => void handleToggleDone(item, done)}
            onEdit={setEditingTask}
            onDelete={setDeletingTask}
            onRetrySync={(item) => void syncTasks([item])}
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
                onPress={() => void syncTasks(pendingSync)}
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
