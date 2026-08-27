import type { ChildFolder, MotherFolder } from "@/types/api/folder";

import { apiFetch } from "./client";

export function listMotherFolders(): Promise<MotherFolder[]> {
  return apiFetch<MotherFolder[]>("/api/mother-folders");
}

export function createMotherFolder(
  name: string,
  color: string,
): Promise<MotherFolder> {
  return apiFetch<MotherFolder>("/api/mother-folders", {
    method: "POST",
    body: { name, color },
  });
}

export function updateMotherFolder(
  id: string,
  changes: { name?: string; color?: string },
): Promise<MotherFolder> {
  return apiFetch<MotherFolder>(`/api/mother-folders/${id}`, {
    method: "PATCH",
    body: changes,
  });
}

export function deleteMotherFolder(id: string): Promise<void> {
  return apiFetch<void>(`/api/mother-folders/${id}`, { method: "DELETE" });
}

export function listChildFolders(
  motherFolderId: string,
): Promise<ChildFolder[]> {
  return apiFetch<ChildFolder[]>(
    `/api/mother-folders/${motherFolderId}/child-folders`,
  );
}

export function createChildFolder(
  motherFolderId: string,
  name: string,
): Promise<ChildFolder> {
  return apiFetch<ChildFolder>(
    `/api/mother-folders/${motherFolderId}/child-folders`,
    { method: "POST", body: { name } },
  );
}

export function updateChildFolder(
  id: string,
  name: string,
): Promise<ChildFolder> {
  return apiFetch<ChildFolder>(`/api/child-folders/${id}`, {
    method: "PATCH",
    body: { name },
  });
}

export function deleteChildFolder(id: string): Promise<void> {
  return apiFetch<void>(`/api/child-folders/${id}`, { method: "DELETE" });
}
