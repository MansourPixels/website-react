import type { Task, TaskInput } from "@/types/Task";

import { apiFetch } from "./client";

/**
 * As tarefas do aluno e as das turmas a que ele pertence, numa lista só,
 * ordenadas por prazo pelo servidor.
 *
 * A sincronização com a Google Agenda é **do servidor**: criar, editar e
 * concluir publicam a sincronização de forma assíncrona depois de a resposta
 * sair, então toda mutação devolve `syncState: "local"` e o estado real aparece
 * num `listTasks()` posterior. Por isso não existe um `setTaskSync` aqui — o
 * frontend exibe `syncState`, nunca o escreve.
 */

/** O servidor ignora nome/cor de pasta enviados pelo cliente; só os ids viajam. */
function toRequestBody(input: TaskInput) {
  return {
    title: input.title.trim(),
    motherFolderId: input.motherFolderId,
    childFolderId: input.childFolderId,
    dueAt: input.dueAt,
  };
}

export function listTasks(signal?: AbortSignal): Promise<Task[]> {
  return apiFetch<Task[]>("/api/tasks", { signal });
}

export function createTask(input: TaskInput): Promise<Task> {
  return apiFetch<Task>("/api/tasks", {
    method: "POST",
    body: toRequestBody(input),
  });
}

/**
 * Cria uma entrega para a turma inteira. Só dono e editor passam; um membro
 * comum toma `403`, e quem não é da turma toma `404`.
 *
 * A tarefa aparece na lista de todos os membros, mas a conclusão e o evento da
 * Agenda são de cada um — quem cria não conclui pelos outros.
 */
export function createClassroomTask(
  classroomId: string,
  input: TaskInput,
): Promise<Task> {
  return apiFetch<Task>(`/api/classrooms/${classroomId}/tasks`, {
    method: "POST",
    body: toRequestBody(input),
  });
}

export function updateTask(id: string, input: TaskInput): Promise<Task> {
  return apiFetch<Task>(`/api/tasks/${id}`, {
    method: "PATCH",
    body: toRequestBody(input),
  });
}

export function setTaskDone(id: string, done: boolean): Promise<Task> {
  return apiFetch<Task>(`/api/tasks/${id}/complete`, {
    method: "PATCH",
    body: { done },
  });
}

export function deleteTask(id: string): Promise<void> {
  return apiFetch<void>(`/api/tasks/${id}`, { method: "DELETE" });
}

/**
 * Reenfileira a publicação na Agenda. Responde `202` sem corpo: é um pedido de
 * nova tentativa, não o resultado dela — quem mostra o desfecho é o próximo
 * `listTasks()`.
 *
 * `409` quando não há conexão Google utilizável; `404` quando a tarefa não é
 * visível para quem chamou.
 */
export function requestTaskSync(id: string): Promise<void> {
  return apiFetch<void>(`/api/tasks/${id}/sync`, { method: "POST" });
}
