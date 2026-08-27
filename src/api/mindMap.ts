import type { MindMap } from "@/types/api/mindMap";

import { apiFetch } from "./client";

export function getMindMap(childFolderId: string): Promise<MindMap> {
  return apiFetch<MindMap>(`/api/child-folders/${childFolderId}/mind-map`);
}
