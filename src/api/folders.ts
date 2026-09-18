import type { ChildFolder, MotherFolder } from "@/types/api/folder";

import { apiFetch, ApiError } from "./client";

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

/**
 * Como `createMotherFolder`, mas reaproveita a pasta existente em vez de
 * falhar quando o nome já está em uso (o back só devolve 409 em colisão exata,
 * então o item precisa estar na lista — se não estiver, relança o erro
 * original em vez de mascarar um problema real).
 *
 * Usado só pelo fluxo de sugestão da IA na captura: ali "não combinou com
 * nenhuma pasta" é uma decisão do sistema, não do usuário, então reaproveitar
 * silenciosamente é o comportamento esperado. Criação manual de pasta deve
 * continuar informando a colisão.
 */
export async function createOrReuseMotherFolder(
  name: string,
  color: string,
): Promise<MotherFolder> {
  try {
    return await createMotherFolder(name, color);
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      const existing = (await listMotherFolders()).find(
        (folder) => folder.name === name,
      );

      if (existing !== undefined) return existing;
    }

    throw error;
  }
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

/** Como `createOrReuseMotherFolder`, mas para o assunto dentro da pasta. */
export async function createOrReuseChildFolder(
  motherFolderId: string,
  name: string,
): Promise<ChildFolder> {
  try {
    return await createChildFolder(motherFolderId, name);
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      const existing = (await listChildFolders(motherFolderId)).find(
        (folder) => folder.name === name,
      );

      if (existing !== undefined) return existing;
    }

    throw error;
  }
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
