import type {
  Content,
  ContentType,
  DownloadUrlResponse,
  FolderSuggestion,
} from "@/types/api/content";

import { apiFetch } from "./client";

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
