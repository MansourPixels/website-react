import type { Flashcard } from "@/types/api/flashcard";
import type { MediaDetail, MediaMindMap, Transcript } from "@/types/api/media";
import type { GradeRequestItem, GradeResponse, QuizQuestion } from "@/types/api/quiz";
import { normalizeMindMapBranch } from "@/utils/mediaArtifacts";

import { apiFetch } from "./client";

/**
 * Os recursos de estudo do áudio ou do vídeo de uma turma: os mesmos formatos do material
 * pessoal (`api/media.ts`), sob o caminho do conteúdo da turma. Qualquer membro lê e corrige
 * o simulado, inclusive o `viewer`; só dono e editor geram de novo. `404` vale para quem não é
 * membro e para o conteúdo que não é áudio nem vídeo daquela pasta.
 *
 * Diferente do `/processing` (minúsculas), o `contentType` e o `processingStatus` daqui vêm em
 * maiúsculas, como no material pessoal.
 */
function base(classroomId: string, folderId: string, contentId: string) {
  return `/api/classrooms/${classroomId}/folders/${folderId}/contents/${contentId}`;
}

/**
 * Estado, duração, resumo e momentos-chave. Enquanto não há dados vem `200` com `summary`
 * nulo, sem momentos e sem duração; um material anterior a estes recursos fica assim para
 * sempre (o texto continua em `getClassroomContentText`).
 */
export function getClassroomMedia(
  classroomId: string,
  folderId: string,
  contentId: string,
  signal?: AbortSignal,
): Promise<MediaDetail> {
  return apiFetch<MediaDetail>(`${base(classroomId, folderId, contentId)}/media`, { signal });
}

/** A transcrição em segmentos; vazia (e não um erro) enquanto não existe. */
export function getClassroomTranscript(
  classroomId: string,
  folderId: string,
  contentId: string,
  signal?: AbortSignal,
): Promise<Transcript> {
  return apiFetch<Transcript>(`${base(classroomId, folderId, contentId)}/transcript`, { signal });
}

/** O simulado do próprio material, sem a alternativa certa; vazio até a geração terminar. */
export function listClassroomMediaQuiz(
  classroomId: string,
  folderId: string,
  contentId: string,
  signal?: AbortSignal,
): Promise<QuizQuestion[]> {
  return apiFetch<QuizQuestion[]>(`${base(classroomId, folderId, contentId)}/quiz`, { signal });
}

/**
 * Corrige as respostas: cada resultado traz a alternativa certa e o momento a rever. Registra
 * a ofensiva de quem respondeu, mas não grava tentativa. `400` para pergunta de outro
 * material ou alternativa fora de A a D.
 */
export function gradeClassroomMediaQuiz(
  classroomId: string,
  folderId: string,
  contentId: string,
  answers: GradeRequestItem[],
  signal?: AbortSignal,
): Promise<GradeResponse> {
  return apiFetch<GradeResponse>(`${base(classroomId, folderId, contentId)}/quiz/grade`, {
    method: "POST",
    body: answers,
    signal,
  });
}

/** Os flashcards do material, ordenados; vazio até a geração terminar. */
export function listClassroomMediaFlashcards(
  classroomId: string,
  folderId: string,
  contentId: string,
  signal?: AbortSignal,
): Promise<Flashcard[]> {
  return apiFetch<Flashcard[]>(`${base(classroomId, folderId, contentId)}/flashcards`, { signal });
}

/**
 * O mapa mental do material; `raiz` é `null` até a geração terminar. Sai normalizado como o
 * do material pessoal (`normalizeMindMapBranch`): o backend manda `null` nos campos opcionais.
 */
export async function getClassroomMediaMindMap(
  classroomId: string,
  folderId: string,
  contentId: string,
  signal?: AbortSignal,
): Promise<MediaMindMap> {
  const map = await apiFetch<MediaMindMap>(`${base(classroomId, folderId, contentId)}/mind-map`, { signal });

  return {
    raiz: map.raiz === null ? null : normalizeMindMapBranch(map.raiz),
    generatedAt: map.generatedAt,
  };
}

/**
 * Gera de novo o simulado, os flashcards e o mapa mental, trocando os anteriores. Só dono e
 * editor (`403` para `viewer`). Responde `202` sem corpo. `409` enquanto o material não está
 * `COMPLETED` ou se não tem fala, `429` acima de 10 por hora (`Retry-After`).
 */
export function regenerateClassroomMediaArtifacts(
  classroomId: string,
  folderId: string,
  contentId: string,
  signal?: AbortSignal,
): Promise<void> {
  return apiFetch<void>(`${base(classroomId, folderId, contentId)}/artifacts/generate`, {
    method: "POST",
    signal,
  });
}
