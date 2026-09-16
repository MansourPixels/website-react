import { describe, expect, it } from "vitest";

import { DEFAULT_TASK, isOverdue, sanitizeTask, sanitizeTasks } from "./tasksStorage";

const VALID = {
  id: "tarefa-1",
  title: "Entregar o relatório",
  motherFolderId: "pasta-1",
  motherFolderName: "Biologia",
  motherFolderColor: "#16a34a",
  childFolderId: "assunto-1",
  childFolderName: "Genética",
  dueAt: "2026-09-18T23:59:00.000Z",
  done: false,
  completedAt: null,
  googleEventId: null,
  syncState: "local",
  createdAt: "2026-09-16T10:00:00.000Z",
  updatedAt: "2026-09-16T10:00:00.000Z",
};

describe("sanitizeTask", () => {
  it("preserva uma tarefa íntegra", () => {
    expect(sanitizeTask(VALID)).toEqual(VALID);
  });

  it("recusa o que não é objeto", () => {
    expect(sanitizeTask(null)).toBeNull();
    expect(sanitizeTask("tarefa")).toBeNull();
    expect(sanitizeTask(undefined)).toBeNull();
  });

  it("recusa tarefa sem id, sem título ou com prazo ilegível", () => {
    expect(sanitizeTask({ ...VALID, id: "" })).toBeNull();
    expect(sanitizeTask({ ...VALID, title: "   " })).toBeNull();
    expect(sanitizeTask({ ...VALID, dueAt: "não é data" })).toBeNull();
  });

  it("cai no default campo a campo quando o tipo é errado", () => {
    const result = sanitizeTask({
      ...VALID,
      motherFolderColor: 123,
      syncState: "inventado",
      done: "sim",
    });

    expect(result?.motherFolderColor).toBe(DEFAULT_TASK.motherFolderColor);
    expect(result?.syncState).toBe(DEFAULT_TASK.syncState);
    expect(result?.done).toBe(DEFAULT_TASK.done);
  });

  it("trata assunto ausente como nulo, não como string vazia", () => {
    const result = sanitizeTask({
      ...VALID,
      childFolderId: "",
      childFolderName: undefined,
    });

    expect(result?.childFolderId).toBeNull();
    expect(result?.childFolderName).toBeNull();
  });

  it("dá uma data de conclusão à tarefa concluída que não tem uma", () => {
    const result = sanitizeTask({ ...VALID, done: true, completedAt: null });

    expect(result?.completedAt).toBe(VALID.dueAt);
  });

  it("descarta a data de conclusão de uma tarefa não concluída", () => {
    const result = sanitizeTask({
      ...VALID,
      done: false,
      completedAt: "2026-09-17T10:00:00.000Z",
    });

    expect(result?.completedAt).toBeNull();
  });
});

describe("sanitizeTasks", () => {
  it("devolve lista vazia pro que não é array", () => {
    expect(sanitizeTasks(null)).toEqual([]);
    expect(sanitizeTasks({ tarefas: [] })).toEqual([]);
  });

  it("descarta os itens corrompidos sem perder os bons", () => {
    const result = sanitizeTasks([VALID, null, { id: "x" }, VALID]);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("tarefa-1");
  });
});

describe("isOverdue", () => {
  const now = new Date("2026-09-20T12:00:00.000Z").getTime();

  it("marca como atrasada a tarefa pendente com prazo vencido", () => {
    expect(isOverdue(sanitizeTask(VALID)!, now)).toBe(true);
  });

  it("nunca marca como atrasada uma tarefa concluída", () => {
    const done = sanitizeTask({ ...VALID, done: true })!;

    expect(isOverdue(done, now)).toBe(false);
  });

  it("não marca como atrasada a tarefa cujo prazo ainda não chegou", () => {
    const future = sanitizeTask({
      ...VALID,
      dueAt: "2026-09-25T23:59:00.000Z",
    })!;

    expect(isOverdue(future, now)).toBe(false);
  });
});
