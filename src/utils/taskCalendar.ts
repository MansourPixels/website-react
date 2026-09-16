import type { CalendarEventInput } from "@/types/Google";
import type { Task } from "@/types/Task";

import {
  createTaskEvent,
  deleteTaskEvent,
  updateTaskEvent,
} from "./googleCalendar";

/**
 * A ponte entre uma tarefa do Revi e um evento da Agenda.
 *
 * As duas funções aqui **nunca lançam**: a tarefa já está salva localmente
 * quando elas são chamadas, e uma falha do Google não pode desfazer isso. O
 * resultado vira `syncState`, que aparece na linha da tarefa.
 */

function toEventInput(task: Task): CalendarEventInput {
  return {
    taskId: task.id,
    title: task.title,
    motherFolderName: task.motherFolderName,
    childFolderName: task.childFolderName,
    dueAt: task.dueAt,
    done: task.done,
  };
}

/** Devolve o id do evento, ou `null` se a publicação falhou. */
export async function publishTaskEvent(task: Task): Promise<string | null> {
  try {
    const input = toEventInput(task);

    return task.googleEventId === null
      ? await createTaskEvent(input)
      : await updateTaskEvent(task.googleEventId, input);
  } catch {
    return null;
  }
}

export async function removeTaskEvent(task: Task): Promise<void> {
  if (task.googleEventId === null) return;

  try {
    await deleteTaskEvent(task.googleEventId);
  } catch {
    // O evento fica na Agenda, mas a tarefa sai do Revi: travar a exclusão
    // local por causa do Google seria prender o aluno à integração.
  }
}
