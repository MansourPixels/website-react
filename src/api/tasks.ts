import type { Task, TaskInput, TaskSyncState } from "@/types/Task";
import { readTasks, sanitizeTask, writeTasks } from "@/utils/tasksStorage";

/**
 * O seam de persistência das tarefas.
 *
 * Hoje é `localStorage`. Quando `/api/tasks` existir no `revi-back`, só este
 * arquivo muda — cada corpo vira um `apiFetch` com o caminho documentado em
 * GOOGLE.md, e as assinaturas já estão nesse formato. Nenhuma tela é tocada.
 */

const NOT_FOUND = "Tarefa não encontrada.";

function nowIso() {
  return new Date().toISOString();
}

function createId() {
  return crypto.randomUUID();
}

function applyInput(task: Task, input: TaskInput): Task {
  return {
    ...task,
    title: input.title.trim(),
    motherFolderId: input.motherFolderId,
    motherFolderName: input.motherFolderName,
    motherFolderColor: input.motherFolderColor,
    childFolderId: input.childFolderId,
    childFolderName: input.childFolderName,
    dueAt: input.dueAt,
    updatedAt: nowIso(),
  };
}

function mutate(id: string, change: (task: Task) => Task): Promise<Task> {
  const tasks = readTasks();
  const index = tasks.findIndex((task) => task.id === id);

  if (index === -1) return Promise.reject(new Error(NOT_FOUND));

  const next = change(tasks[index]);

  tasks[index] = next;
  writeTasks(tasks);

  return Promise.resolve(next);
}

export function listTasks(): Promise<Task[]> {
  return Promise.resolve(readTasks());
}

export function createTask(input: TaskInput): Promise<Task> {
  const timestamp = nowIso();

  const task = sanitizeTask({
    id: createId(),
    title: input.title.trim(),
    motherFolderId: input.motherFolderId,
    motherFolderName: input.motherFolderName,
    motherFolderColor: input.motherFolderColor,
    childFolderId: input.childFolderId,
    childFolderName: input.childFolderName,
    dueAt: input.dueAt,
    done: false,
    completedAt: null,
    googleEventId: null,
    syncState: "local",
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  if (task === null) {
    return Promise.reject(new Error("Dados da tarefa incompletos."));
  }

  writeTasks([...readTasks(), task]);

  return Promise.resolve(task);
}

export function updateTask(id: string, input: TaskInput): Promise<Task> {
  return mutate(id, (task) => applyInput(task, input));
}

export function setTaskDone(id: string, done: boolean): Promise<Task> {
  return mutate(id, (task) => ({
    ...task,
    done,
    completedAt: done ? nowIso() : null,
    updatedAt: nowIso(),
  }));
}

/**
 * O resultado da conversa com a Agenda. Separado do `updateTask` porque a
 * sincronização acontece *depois* de a tarefa já estar salva: a tarefa nunca se
 * perde porque o Google falhou.
 */
export function setTaskSync(
  id: string,
  syncState: TaskSyncState,
  googleEventId: string | null,
): Promise<Task> {
  return mutate(id, (task) => ({ ...task, syncState, googleEventId }));
}

export function deleteTask(id: string): Promise<void> {
  writeTasks(readTasks().filter((task) => task.id !== id));

  return Promise.resolve();
}
