import type { Task } from "@/types/Task";

/**
 * Derivado, nunca persistido nem devolvido pelo servidor: estado guardado que
 * depende do relógio envelhece errado sozinho.
 */
export function isOverdue(task: Task, now: number = Date.now()) {
  return !task.done && new Date(task.dueAt).getTime() < now;
}
