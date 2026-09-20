import type { Content } from "@/types/api/content";
import type { MediaDetail, Transcript } from "@/types/api/media";

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
