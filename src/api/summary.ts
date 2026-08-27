import type { FolderSummary } from "@/types/api/summary";

import { ApiError, apiFetch } from "./client";

// 404 aqui significa "ainda não gerado" (upload pendente ou categorização
// em andamento) — um estado válido, não um erro de rede.
export async function getSummary(
  childFolderId: string,
): Promise<FolderSummary | null> {
  try {
    return await apiFetch<FolderSummary>(
      `/api/child-folders/${childFolderId}/summary`,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
