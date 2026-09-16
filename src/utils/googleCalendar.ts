import type { CalendarEventInput } from "@/types/Google";

import { GoogleError, ensureAccessToken, issueForStatus } from "./googleAuth";

const CALENDAR_API =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";

/** Uma entrega é um instante, mas a Agenda quer uma faixa. */
const EVENT_DURATION_MS = 30 * 60 * 1000;

const FALLBACK_TIME_ZONE = "America/Sao_Paulo";

// A marca que torna a operação idempotente: antes de criar, procuramos por ela.
// Sem isso, um "tentar de novo" duplicaria a entrega na agenda do aluno.
const TASK_ID_PROPERTY = "reviTaskId";

function resolveTimeZone() {
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return resolved !== undefined && resolved.length > 0
      ? resolved
      : FALLBACK_TIME_ZONE;
  } catch {
    return FALLBACK_TIME_ZONE;
  }
}

interface CalendarEvent {
  id: string;
}

interface CalendarEventList {
  items?: CalendarEvent[];
}

async function request<T>(
  path: string,
  init: { method: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown } = {
    method: "GET",
  },
): Promise<T | null> {
  const token = await ensureAccessToken();

  if (token === null) throw new GoogleError("consentDenied");

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  if (init.body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(`${CALENDAR_API}${path}`, {
    method: init.method,
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  // 410 é "já não existe": um evento que o aluno apagou à mão na Agenda.
  if (response.status === 404 || response.status === 410) return null;

  if (!response.ok) throw new GoogleError(issueForStatus(response.status));

  if (response.status === 204) return null;

  const text = await response.text();

  return (text.length === 0 ? null : JSON.parse(text)) as T | null;
}

function buildEvent(input: CalendarEventInput) {
  const start = new Date(input.dueAt);
  const end = new Date(start.getTime() + EVENT_DURATION_MS);
  const timeZone = resolveTimeZone();
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  const subject =
    input.childFolderName === null
      ? input.motherFolderName
      : `${input.motherFolderName} · ${input.childFolderName}`;

  return {
    // O ✓ no título é o que faz a tarefa concluída se ler como concluída na
    // Agenda, que não tem noção de "feito".
    summary: input.done ? `✓ ${input.title}` : input.title,
    description: `Entrega de ${subject}\nCriado pelo Revi.`,
    start: { dateTime: start.toISOString(), timeZone },
    end: { dateTime: end.toISOString(), timeZone },
    ...(origin.startsWith("http")
      ? { source: { title: "Revi", url: `${origin}/tarefas` } }
      : {}),
    extendedProperties: { private: { [TASK_ID_PROPERTY]: input.taskId } },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 1440 },
        { method: "popup", minutes: 60 },
      ],
    },
  };
}

/** O id do evento que já representa esta tarefa, se houver. */
export async function findTaskEvent(taskId: string): Promise<string | null> {
  const query = new URLSearchParams({
    privateExtendedProperty: `${TASK_ID_PROPERTY}=${taskId}`,
    maxResults: "1",
    showDeleted: "false",
  });

  const list = await request<CalendarEventList>(`?${query.toString()}`);
  const [event] = list?.items ?? [];

  return event?.id ?? null;
}

/** Cria — ou atualiza, se a tarefa já tiver um evento. */
export async function createTaskEvent(
  input: CalendarEventInput,
): Promise<string> {
  const existing = await findTaskEvent(input.taskId);

  if (existing !== null) {
    await updateTaskEvent(existing, input);

    return existing;
  }

  const created = await request<CalendarEvent>("", {
    method: "POST",
    body: buildEvent(input),
  });

  if (created === null) throw new GoogleError("requestFailed");

  return created.id;
}

/** Propaga título, data/hora e conclusão. Recria se o evento sumiu. */
export async function updateTaskEvent(
  eventId: string,
  input: CalendarEventInput,
): Promise<string> {
  const updated = await request<CalendarEvent>(`/${eventId}`, {
    method: "PATCH",
    body: buildEvent(input),
  });

  if (updated !== null) return updated.id;

  return createTaskEvent(input);
}

export async function deleteTaskEvent(eventId: string): Promise<void> {
  await request<void>(`/${eventId}`, { method: "DELETE" });
}
