import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));

vi.mock("./client", () => ({ apiFetch }));

import {
  createClassroomTask,
  createTask,
  deleteTask,
  listTasks,
  requestTaskSync,
  setTaskDone,
  updateTask,
} from "./tasks";

const INPUT = {
  title: "  Ler capítulo 3  ",
  motherFolderId: "folder-1",
  childFolderId: null,
  dueAt: "2026-09-20T12:00:00.000Z",
};

describe("tasks API", () => {
  beforeEach(() => apiFetch.mockReset());

  it("lists tasks with an optional abort signal", async () => {
    const signal = new AbortController().signal;
    apiFetch.mockResolvedValue([]);
    await listTasks(signal);
    expect(apiFetch).toHaveBeenCalledWith("/api/tasks", { signal });
  });

  it("creates a personal task, trimming the title and preserving childFolderId: null", async () => {
    apiFetch.mockResolvedValue({ id: "task-1" });
    await createTask(INPUT);
    expect(apiFetch).toHaveBeenCalledWith("/api/tasks", {
      method: "POST",
      body: {
        title: "Ler capítulo 3",
        motherFolderId: "folder-1",
        childFolderId: null,
        dueAt: "2026-09-20T12:00:00.000Z",
      },
    });
  });

  it("creates a classroom task against the classroom endpoint, with the same body shape", async () => {
    apiFetch.mockResolvedValue({ id: "task-1", classroomId: "class-1" });
    await createClassroomTask("class-1", INPUT);
    expect(apiFetch).toHaveBeenCalledWith("/api/classrooms/class-1/tasks", {
      method: "POST",
      body: {
        title: "Ler capítulo 3",
        motherFolderId: "folder-1",
        childFolderId: null,
        dueAt: "2026-09-20T12:00:00.000Z",
      },
    });
  });

  it("updates a task by id with the same request body shape", async () => {
    apiFetch.mockResolvedValue({ id: "task-1" });
    await updateTask("task-1", { ...INPUT, childFolderId: "child-1" });
    expect(apiFetch).toHaveBeenCalledWith("/api/tasks/task-1", {
      method: "PATCH",
      body: {
        title: "Ler capítulo 3",
        motherFolderId: "folder-1",
        childFolderId: "child-1",
        dueAt: "2026-09-20T12:00:00.000Z",
      },
    });
  });

  it("marks a task done or reopens it", async () => {
    apiFetch.mockResolvedValue({ id: "task-1", done: true });
    await setTaskDone("task-1", true);
    expect(apiFetch).toHaveBeenCalledWith("/api/tasks/task-1/complete", {
      method: "PATCH",
      body: { done: true },
    });
  });

  it("deletes a task", async () => {
    apiFetch.mockResolvedValue(undefined);
    await deleteTask("task-1");
    expect(apiFetch).toHaveBeenCalledWith("/api/tasks/task-1", {
      method: "DELETE",
    });
  });

  it("requests a resync", async () => {
    apiFetch.mockResolvedValue(undefined);
    await requestTaskSync("task-1");
    expect(apiFetch).toHaveBeenCalledWith("/api/tasks/task-1/sync", {
      method: "POST",
    });
  });
});
