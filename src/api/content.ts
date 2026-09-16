import { mockSearchContents } from "@/mocks/contentSearch";
import type {
  Content,
  ContentText,
  ContentType,
  DownloadUrlResponse,
  FolderSuggestion,
} from "@/types/api/content";
import { normalizeText } from "@/utils/text";

import { ApiError, apiFetch } from "./client";

function buildContentFormData(file: File, contentType: ContentType): FormData {
  const formData = new FormData();

  formData.append("file", file, file.name);
  formData.append("contentType", contentType);

  return formData;
}

export function uploadContent(
  childFolderId: string,
  file: File,
  contentType: ContentType,
): Promise<Content> {
  return apiFetch<Content>(`/api/child-folders/${childFolderId}/contents`, {
    method: "POST",
    body: buildContentFormData(file, contentType),
  });
}

export function listContent(childFolderId: string): Promise<Content[]> {
  return apiFetch<Content[]>(`/api/child-folders/${childFolderId}/contents`);
}

export function getDownloadUrl(contentId: string): Promise<DownloadUrlResponse> {
  return apiFetch<DownloadUrlResponse>(`/api/contents/${contentId}/download-url`);
}

export function suggestFolder(
  file: File,
  contentType: ContentType,
): Promise<FolderSuggestion> {
  return apiFetch<FolderSuggestion>("/api/contents/folder-suggestion", {
    method: "POST",
    body: buildContentFormData(file, contentType),
  });
}

/**
 * A busca por OCR ainda não foi implementada pelo backend. Enquanto isso, apenas
 * esse fluxo pode usar o fallback demonstrativo.
 */
function isMissingEndpoint(error: unknown): boolean {
  return (
    error instanceof ApiError && (error.status === 404 || error.status === 501)
  );
}

/**
 * Texto extraído do conteúdo por OCR.
 *
 * `extractedAt: null` significa "ainda não extraído" — um estado válido, não um
 * erro, mesma convenção de `getSummary`.
 */
export function getContentText(
  contentId: string,
  signal?: AbortSignal,
): Promise<ContentText> {
  return apiFetch<ContentText>(`/api/contents/${contentId}/text`, {
    signal,
  });
}

/**
 * Busca materiais dentro do assunto, por nome **e** pelo texto de OCR — é o
 * texto que justifica o endpoint, já que o cliente não tem acesso a ele.
 */
export async function searchContent(
  childFolderId: string,
  term: string,
  signal?: AbortSignal,
): Promise<Content[]> {
  const query = new URLSearchParams({ search: term });

  try {
    const results = await apiFetch<Content[]>(
      `/api/child-folders/${childFolderId}/contents?${query.toString()}`,
      { signal },
    );

    // Rede de segurança: um backend que ainda ignore `?search=` devolveria a
    // lista inteira, e a tela mentiria sobre ter buscado. O filtro por nome
    // não substitui o endpoint — só o servidor busca dentro do OCR.
    const normalized = normalizeText(term);
    const matchesName = results.filter((content) =>
      normalizeText(content.name).includes(normalized),
    );

    if (matchesName.length === results.length) return results;

    return mockSearchContents(results, term);
  } catch (error) {
    if (isMissingEndpoint(error)) {
      return mockSearchContents(await listContent(childFolderId), term);
    }

    throw error;
  }
}
