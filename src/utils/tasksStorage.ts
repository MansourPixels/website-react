import type { Task, TaskSyncState } from "@/types/Task";

const TASKS_KEY = "revi:tarefas";

export const DEFAULT_TASK: Task = {
  id: "",
  title: "",
  motherFolderId: "",
  motherFolderName: "",
  motherFolderColor: "#71717a",
  childFolderId: null,
  childFolderName: null,
  dueAt: "",
  done: false,
  completedAt: null,
  googleEventId: null,
  syncState: "local",
  createdAt: "",
  updatedAt: "",
};

const SYNC_STATES: TaskSyncState[] = ["local", "sincronizada", "falhou"];

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);

    if (raw === null) return null;

    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Armazenamento cheio ou bloqueado: a tarefa vale só nesta sessão.
  }
}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function readNullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function readSyncState(value: unknown): TaskSyncState {
  return SYNC_STATES.includes(value as TaskSyncState)
    ? (value as TaskSyncState)
    : DEFAULT_TASK.syncState;
}

function isValidDate(value: unknown): value is string {
  return (
    typeof value === "string" && !Number.isNaN(new Date(value).getTime())
  );
}

/**
 * Devolve `null` para o que não é tarefa. Um registro sem id, sem título ou sem
 * um prazo legível não tem como ser exibido nem editado — arrastá-lo com
 * valores padrão criaria uma linha fantasma que o aluno não consegue apagar.
 */
export function sanitizeTask(value: unknown): Task | null {
  if (value === null || typeof value !== "object") return null;

  const raw = value as Partial<Task>;

  const id = readString(raw.id, "");
  const title = readString(raw.title, "").trim();

  if (id.length === 0 || title.length === 0 || !isValidDate(raw.dueAt)) {
    return null;
  }

  const done = readBoolean(raw.done, DEFAULT_TASK.done);
  const completedAt = isValidDate(raw.completedAt) ? raw.completedAt : null;

  return {
    id,
    title,
    motherFolderId: readString(raw.motherFolderId, DEFAULT_TASK.motherFolderId),
    motherFolderName: readString(
      raw.motherFolderName,
      DEFAULT_TASK.motherFolderName,
    ),
    motherFolderColor: readString(
      raw.motherFolderColor,
      DEFAULT_TASK.motherFolderColor,
    ),
    childFolderId: readNullableString(raw.childFolderId),
    childFolderName: readNullableString(raw.childFolderName),
    dueAt: raw.dueAt,
    done,
    // Concluída sem data de conclusão desordenaria a seção "Concluídas"; o
    // prazo é a melhor aproximação que existe no próprio registro.
    completedAt: done ? (completedAt ?? raw.dueAt) : null,
    googleEventId: readNullableString(raw.googleEventId),
    syncState: readSyncState(raw.syncState),
    createdAt: isValidDate(raw.createdAt) ? raw.createdAt : raw.dueAt,
    updatedAt: isValidDate(raw.updatedAt) ? raw.updatedAt : raw.dueAt,
  };
}

export function sanitizeTasks(value: unknown): Task[] {
  if (!Array.isArray(value)) return [];

  const tasks: Task[] = [];

  for (const item of value) {
    const task = sanitizeTask(item);

    if (task !== null) tasks.push(task);
  }

  return tasks;
}

/** Derivado, nunca persistido: estado guardado que depende do relógio envelhece errado. */
export function isOverdue(task: Task, now: number = Date.now()) {
  return !task.done && new Date(task.dueAt).getTime() < now;
}

export function readTasks(): Task[] {
  return sanitizeTasks(readJson<unknown>(TASKS_KEY));
}

export function writeTasks(tasks: Task[]) {
  writeJson(TASKS_KEY, tasks);
}
