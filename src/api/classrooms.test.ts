import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiFetch, ApiError } = vi.hoisted(() => {
  class TestApiError extends Error {
    status: number;
    detail: string;
    constructor(status: number, detail: string) { super(detail); this.status = status; this.detail = detail; }
  }
  return { apiFetch: vi.fn(), ApiError: TestApiError };
});

vi.mock("./client", () => ({ apiFetch, ApiError }));

import {
  createClassroomMaterialSnapshot,
  createClassroomReference,
  getClassroomMaterialSnapshot,
  listReviMaterials,
} from "./classrooms";

describe("classroom material sharing API", () => {
  beforeEach(() => apiFetch.mockReset());

  it("uses the real personal material catalogue endpoint", async () => {
    apiFetch.mockResolvedValue([{ childFolderId: "personal-1", kinds: ["mindmap"] }]);
    await expect(listReviMaterials()).resolves.toEqual([{ childFolderId: "personal-1", kinds: ["mindmap"] }]);
    expect(apiFetch).toHaveBeenCalledWith("/api/me/materials", { signal: undefined });
  });

  it("sends the reference and snapshot payloads without a mock fallback", async () => {
    apiFetch.mockResolvedValue({ id: "content-1" });
    await createClassroomReference("class-1", "folder-1", { kind: "mindmap", title: "Mapa", description: "", reviMaterialId: "personal-1" });
    expect(apiFetch).toHaveBeenLastCalledWith("/api/classrooms/class-1/folders/folder-1/contents", { method: "POST", body: { kind: "mindmap", title: "Mapa", description: "", reviMaterialId: "personal-1" } });
    await createClassroomMaterialSnapshot("class-1", "folder-1", { sourceChildFolderId: "personal-1", title: "Cópia", description: "" });
    expect(apiFetch).toHaveBeenLastCalledWith("/api/classrooms/class-1/folders/folder-1/contents/snapshots", { method: "POST", body: { sourceChildFolderId: "personal-1", title: "Cópia", description: "" } });
  });

  it("loads a snapshot by content id", async () => {
    apiFetch.mockResolvedValue({ contentId: "content-1" });
    await getClassroomMaterialSnapshot("class-1", "folder-1", "content-1");
    expect(apiFetch).toHaveBeenCalledWith("/api/classrooms/class-1/folders/folder-1/contents/content-1/snapshot", { signal: undefined });
  });

});
