import { describe, expect, it } from "vitest";

import type { Task } from "@/types/Task";

import { isOverdue } from "./tasks";

const NOW = Date.parse("2026-09-17T12:00:00Z");

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "0198",
    title: "Relatório de laboratório",
    motherFolderId: "mother",
    motherFolderName: "Biologia",
    motherFolderColor: "#16a34a",
    childFolderId: null,
    childFolderName: null,
    dueAt: "2026-09-18T23:59:00Z",
    done: false,
    completedAt: null,
    googleEventId: null,
    syncState: "local",
    classroomId: null,
    classroomName: null,
    createdAt: "2026-09-17T10:00:00Z",
    updatedAt: "2026-09-17T10:00:00Z",
    ...overrides,
  };
}

describe("isOverdue", () => {
  it("não considera atrasada a tarefa cujo prazo ainda não chegou", () => {
    expect(isOverdue(makeTask(), NOW)).toBe(false);
  });

  it("considera atrasada a tarefa pendente com prazo vencido", () => {
    expect(isOverdue(makeTask({ dueAt: "2026-09-16T23:59:00Z" }), NOW)).toBe(
      true,
    );
  });

  it("nunca atrasa uma tarefa concluída, por mais vencida que esteja", () => {
    const task = makeTask({
      dueAt: "2026-01-01T00:00:00Z",
      done: true,
      completedAt: "2026-01-02T00:00:00Z",
    });

    expect(isOverdue(task, NOW)).toBe(false);
  });

  it("trata o instante exato do prazo como ainda no prazo", () => {
    expect(isOverdue(makeTask({ dueAt: new Date(NOW).toISOString() }), NOW)).toBe(
      false,
    );
  });
});
