import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiFetch, ApiError } = vi.hoisted(() => {
  class TestApiError extends Error {
    status: number;
    detail: string;
    constructor(status: number, detail: string) {
      super(detail);
      this.status = status;
      this.detail = detail;
    }
  }
  return { apiFetch: vi.fn(), ApiError: TestApiError };
});

vi.mock("./client", () => ({ apiFetch, ApiError }));

import { createOrReuseChildFolder, createOrReuseMotherFolder } from "./folders";

describe("createOrReuseMotherFolder", () => {
  beforeEach(() => apiFetch.mockReset());

  it("creates the folder normally when there is no conflict", async () => {
    apiFetch.mockResolvedValueOnce({ id: "folder-1", name: "Matemática", color: "#fff", amount: 0 });

    await expect(createOrReuseMotherFolder("Matemática", "#fff")).resolves.toEqual({
      id: "folder-1",
      name: "Matemática",
      color: "#fff",
      amount: 0,
    });
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });

  it("reuses the existing folder with the same name on a 409 conflict", async () => {
    apiFetch
      .mockRejectedValueOnce(new ApiError(409, "A mother folder named 'Matemática' already exists for this owner"))
      .mockResolvedValueOnce([
        { id: "other-1", name: "Português", color: "#000", amount: 2 },
        { id: "folder-1", name: "Matemática", color: "#fff", amount: 5 },
      ]);

    await expect(createOrReuseMotherFolder("Matemática", "#fff")).resolves.toEqual({
      id: "folder-1",
      name: "Matemática",
      color: "#fff",
      amount: 5,
    });
  });

  it("rethrows the original error when no folder with that name is found", async () => {
    const error = new ApiError(409, "A mother folder named 'Matemática' already exists for this owner");
    apiFetch.mockRejectedValueOnce(error).mockResolvedValueOnce([]);

    await expect(createOrReuseMotherFolder("Matemática", "#fff")).rejects.toBe(error);
  });

  it("rethrows non-409 errors without listing folders", async () => {
    const error = new ApiError(500, "Falha interna");
    apiFetch.mockRejectedValueOnce(error);

    await expect(createOrReuseMotherFolder("Matemática", "#fff")).rejects.toBe(error);
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });
});

describe("createOrReuseChildFolder", () => {
  beforeEach(() => apiFetch.mockReset());

  it("creates the child folder normally when there is no conflict", async () => {
    apiFetch.mockResolvedValueOnce({ id: "child-1", name: "Equações", motherFolderId: "folder-1" });

    await expect(createOrReuseChildFolder("folder-1", "Equações")).resolves.toEqual({
      id: "child-1",
      name: "Equações",
      motherFolderId: "folder-1",
    });
  });

  it("reuses the existing child folder with the same name on a 409 conflict", async () => {
    apiFetch
      .mockRejectedValueOnce(new ApiError(409, "A child folder named 'Equações' already exists for this owner"))
      .mockResolvedValueOnce([{ id: "child-1", name: "Equações", motherFolderId: "folder-1" }]);

    await expect(createOrReuseChildFolder("folder-1", "Equações")).resolves.toEqual({
      id: "child-1",
      name: "Equações",
      motherFolderId: "folder-1",
    });
    expect(apiFetch).toHaveBeenLastCalledWith("/api/mother-folders/folder-1/child-folders");
  });

  it("rethrows the original error when no child folder with that name is found", async () => {
    const error = new ApiError(409, "A child folder named 'Equações' already exists for this owner");
    apiFetch.mockRejectedValueOnce(error).mockResolvedValueOnce([]);

    await expect(createOrReuseChildFolder("folder-1", "Equações")).rejects.toBe(error);
  });
});
