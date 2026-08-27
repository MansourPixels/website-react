import type { Flashcard } from "@/types/api/flashcard";

import { apiFetch } from "./client";

export function listFlashcards(childFolderId: string): Promise<Flashcard[]> {
  return apiFetch<Flashcard[]>(
    `/api/child-folders/${childFolderId}/flashcards`,
  );
}
