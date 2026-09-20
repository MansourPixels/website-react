import type { Content } from "@/types/api/content";
import type { Flashcard } from "@/types/api/flashcard";
import type { MediaDetail, MediaMindMap, Transcript } from "@/types/api/media";
import type { GradeRequestItem, GradeResponse, QuizQuestion } from "@/types/api/quiz";
import { normalizeMindMapBranch } from "@/utils/mediaArtifacts";

import { apiFetch, apiUpload, type UploadOptions } from "./client";

/**
 * Envia um áudio (`.mp3`, `.m4a`, `.wav`, `.ogg` ou `.flac`, até 200 MB) para um
 * assunto. Responde `202` assim que o arquivo é guardado: a transcrição e a
 * análise acontecem depois, e o andamento está em `processingStatus`.
 *
 * Erros: `400` extensão que não é de áudio · `404` assunto que não é seu ·
 * `413` acima do limite · `429` passou das 10 mídias por hora (`Retry-After`).
 * Atenção: um arquivo muito acima do limite não chega a receber `413`: o
 * servidor fecha a conexão no meio do envio e o navegador vê só um erro de
 * rede. Por isso o tamanho é conferido antes (`audioProblem`).
 *
 * A URL de reprodução vem de `getDownloadUrl` (`api/content.ts`), pedida sob
 * demanda: ela expira em 15 minutos.
 */
export function uploadMedia(
  childFolderId: string,
  file: File,
  options: UploadOptions = {},
): Promise<Content> {
  const formData = new FormData();
  formData.append("file", file, file.name);

  // Com progresso (XHR): um áudio de até 200 MB leva minutos para sair.
  return apiUpload<Content>(
    `/api/child-folders/${childFolderId}/media`,
    formData,
    options,
  );
}

/** Status, duração, resumo e momentos-chave; `404` também vale para PDF e imagem. */
export function getMedia(
  contentId: string,
  signal?: AbortSignal,
): Promise<MediaDetail> {
  return apiFetch<MediaDetail>(`/api/contents/${contentId}/media`, { signal });
}

/** A transcrição em segmentos; vazia (e não um erro) enquanto não existe. */
export function getTranscript(
  contentId: string,
  signal?: AbortSignal,
): Promise<Transcript> {
  return apiFetch<Transcript>(`/api/contents/${contentId}/transcript`, {
    signal,
  });
}

/**
 * O simulado do próprio áudio, sem a alternativa certa. Vem vazio (não é erro)
 * até a geração terminar, depois de o áudio ficar `COMPLETED`; `404` vale
 * para material de outra pessoa e para o que não é mídia.
 */
export function listMediaQuiz(
  contentId: string,
  signal?: AbortSignal,
): Promise<QuizQuestion[]> {
  return apiFetch<QuizQuestion[]>(`/api/contents/${contentId}/quiz`, {
    signal,
  });
}

/**
 * Corrige as respostas: cada resultado traz a alternativa certa e o momento a
 * rever. Registra a ofensiva do dia, mas não grava tentativa (não entra no
 * desempenho nem no plano de estudo). `400` para pergunta de outro material ou
 * alternativa fora de A a D.
 */
export function gradeMediaQuiz(
  contentId: string,
  answers: GradeRequestItem[],
  signal?: AbortSignal,
): Promise<GradeResponse> {
  return apiFetch<GradeResponse>(`/api/contents/${contentId}/quiz/grade`, {
    method: "POST",
    body: answers,
    signal,
  });
}

/** Os flashcards do áudio, ordenados; vazio até a geração terminar. */
export function listMediaFlashcards(
  contentId: string,
  signal?: AbortSignal,
): Promise<Flashcard[]> {
  return apiFetch<Flashcard[]>(`/api/contents/${contentId}/flashcards`, {
    signal,
  });
}

/**
 * O mapa mental do áudio; `raiz` é `null` até a geração terminar. O backend manda
 * `null` nos campos opcionais de cada nó, e o resto do app (o mapa da pasta) usa
 * campo ausente, então o mapa sai daqui normalizado (`normalizeMindMapBranch`).
 */
export async function getMediaMindMap(
  contentId: string,
  signal?: AbortSignal,
): Promise<MediaMindMap> {
  const map = await apiFetch<MediaMindMap>(
    `/api/contents/${contentId}/mind-map`,
    { signal },
  );

  return {
    raiz: map.raiz === null ? null : normalizeMindMapBranch(map.raiz),
    generatedAt: map.generatedAt,
  };
}

/**
 * Gera de novo o simulado, os flashcards e o mapa mental do áudio, trocando os
 * anteriores (é também a saída de uma geração que falhou: artefatos derivados não
 * têm status próprio). Responde `202` sem corpo. `409` enquanto o áudio não
 * está `COMPLETED` ou se não tem fala, `429` acima de 10 por hora (`Retry-After`).
 */
export function regenerateMediaArtifacts(
  contentId: string,
  signal?: AbortSignal,
): Promise<void> {
  return apiFetch<void>(`/api/contents/${contentId}/artifacts/generate`, {
    method: "POST",
    signal,
  });
}
