import type {
  Classroom,
  ClassroomContent,
  ClassroomContentProcessing,
  ClassroomContentText,
  ClassroomDownloadUrl,
  ClassroomFolder,
  ClassroomFlashcard,
  ClassroomInvite,
  ClassroomInvitePreview,
  ClassroomMindMap,
  ClassroomMember,
  ClassroomQuizQuestion,
  ClassroomRole,
  ClassroomMaterialSnapshot,
  ClassroomReferenceKind,
  ClassroomSummary,
  OwnerMaterial,
} from "@/types/api/classroom";

import { classroomKindForFileName } from "@/utils/materials";
import { ApiError, apiFetch } from "./client";

export function listClassrooms(): Promise<Classroom[]> {
  return apiFetch("/api/classrooms");
}

export function getClassroom(classroomId: string): Promise<Classroom> {
  return apiFetch(`/api/classrooms/${classroomId}`);
}

export function createClassroom(payload: {
  name: string;
  description: string;
  color: string;
}): Promise<Classroom> {
  return apiFetch("/api/classrooms", { method: "POST", body: payload });
}

export function updateClassroom(
  classroomId: string,
  payload: { name: string; description: string; color: string },
): Promise<Classroom> {
  return apiFetch(`/api/classrooms/${classroomId}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteClassroom(classroomId: string): Promise<void> {
  return apiFetch(`/api/classrooms/${classroomId}`, { method: "DELETE" });
}

export function leaveClassroom(classroomId: string): Promise<void> {
  return apiFetch(`/api/classrooms/${classroomId}/leave`, { method: "POST" });
}

export function listMembers(classroomId: string): Promise<ClassroomMember[]> {
  return apiFetch(`/api/classrooms/${classroomId}/members`);
}

export function updateMemberRole(
  classroomId: string,
  memberId: string,
  role: Exclude<ClassroomRole, "owner">,
): Promise<ClassroomMember> {
  return apiFetch(`/api/classrooms/${classroomId}/members/${memberId}`, {
    method: "PATCH",
    body: { role },
  });
}

export function removeMember(
  classroomId: string,
  memberId: string,
): Promise<void> {
  return apiFetch(`/api/classrooms/${classroomId}/members/${memberId}`, {
    method: "DELETE",
  });
}

export function listFolders(classroomId: string): Promise<ClassroomFolder[]> {
  return apiFetch(`/api/classrooms/${classroomId}/folders`);
}

export function getFolder(
  classroomId: string,
  folderId: string,
): Promise<ClassroomFolder> {
  return apiFetch(`/api/classrooms/${classroomId}/folders/${folderId}`);
}

export async function getClassroomSummary(
  classroomId: string,
  folderId: string,
  signal?: AbortSignal,
): Promise<ClassroomSummary | null> {
  const result = await apiFetch<ClassroomSummary | undefined>(`/api/classrooms/${classroomId}/folders/${folderId}/summary`, { signal });
  return result ?? null;
}

export function listClassroomFlashcards(
  classroomId: string,
  folderId: string,
  signal?: AbortSignal,
): Promise<ClassroomFlashcard[]> {
  return apiFetch(`/api/classrooms/${classroomId}/folders/${folderId}/flashcards`, { signal });
}

export function listClassroomQuiz(
  classroomId: string,
  folderId: string,
  signal?: AbortSignal,
): Promise<ClassroomQuizQuestion[]> {
  return apiFetch(`/api/classrooms/${classroomId}/folders/${folderId}/quiz`, { signal });
}

export async function getClassroomMindMap(
  classroomId: string,
  folderId: string,
  signal?: AbortSignal,
): Promise<ClassroomMindMap | null> {
  const result = await apiFetch<ClassroomMindMap | undefined>(`/api/classrooms/${classroomId}/folders/${folderId}/mind-map`, { signal });
  return result ?? null;
}

export function createFolder(
  classroomId: string,
  payload: { name: string; color: string },
): Promise<ClassroomFolder> {
  return apiFetch(`/api/classrooms/${classroomId}/folders`, {
    method: "POST",
    body: payload,
  });
}

export function updateFolder(
  classroomId: string,
  folderId: string,
  payload: { name: string; color: string },
): Promise<ClassroomFolder> {
  return apiFetch(`/api/classrooms/${classroomId}/folders/${folderId}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteFolder(
  classroomId: string,
  folderId: string,
): Promise<void> {
  return apiFetch(`/api/classrooms/${classroomId}/folders/${folderId}`, {
    method: "DELETE",
  });
}

export function listContents(
  classroomId: string,
  folderId: string,
  signal?: AbortSignal,
): Promise<ClassroomContent[]> {
  return apiFetch(`/api/classrooms/${classroomId}/folders/${folderId}/contents`, {
    signal,
  });
}

export function listReviMaterials(signal?: AbortSignal): Promise<OwnerMaterial[]> {
  return apiFetch("/api/me/materials", { signal });
}

export function createClassroomReference(
  classroomId: string,
  folderId: string,
  payload: {
    kind: ClassroomReferenceKind;
    title: string;
    description: string;
    reviMaterialId: string;
  },
): Promise<ClassroomContent> {
  return apiFetch(`/api/classrooms/${classroomId}/folders/${folderId}/contents`, {
    method: "POST",
    body: payload,
  });
}

export function createClassroomMaterialSnapshot(
  classroomId: string,
  folderId: string,
  payload: { sourceChildFolderId: string; title: string; description: string },
): Promise<ClassroomContent> {
  return apiFetch(`/api/classrooms/${classroomId}/folders/${folderId}/contents/snapshots`, {
    method: "POST",
    body: payload,
  });
}

export function getClassroomMaterialSnapshot(
  classroomId: string,
  folderId: string,
  contentId: string,
  signal?: AbortSignal,
): Promise<ClassroomMaterialSnapshot> {
  return apiFetch(
    `/api/classrooms/${classroomId}/folders/${folderId}/contents/${contentId}/snapshot`,
    { signal },
  );
}

export interface UploadClassroomContentPayload {
  file: File;
  title: string;
  description?: string;
}

export function uploadClassroomContent(
  classroomId: string,
  folderId: string,
  payload: UploadClassroomContentPayload,
): Promise<ClassroomContent> {
  const kind = classroomKindForFileName(payload.file.name);

  if (kind === null) {
    throw new ApiError(
      400,
      "Envie um PDF, uma imagem (JPG, JPEG ou PNG), um áudio (MP3, M4A, WAV, OGG ou FLAC) ou um vídeo (MP4, MOV, MKV ou WEBM).",
    );
  }

  const formData = new FormData();
  formData.append("file", payload.file, payload.file.name);
  formData.append("kind", kind);
  formData.append("title", payload.title);
  if (payload.description !== undefined && payload.description.length > 0) {
    formData.append("description", payload.description);
  }

  return apiFetch(
    `/api/classrooms/${classroomId}/folders/${folderId}/contents/upload`,
    { method: "POST", body: formData },
  );
}

export function getClassroomDownloadUrl(
  classroomId: string,
  folderId: string,
  contentId: string,
  signal?: AbortSignal,
): Promise<ClassroomDownloadUrl> {
  return apiFetch(
    `/api/classrooms/${classroomId}/folders/${folderId}/contents/${contentId}/download-url`,
    { signal },
  );
}

export function getClassroomContentProcessing(
  classroomId: string,
  folderId: string,
  contentId: string,
  signal?: AbortSignal,
): Promise<ClassroomContentProcessing> {
  return apiFetch(
    `/api/classrooms/${classroomId}/folders/${folderId}/contents/${contentId}/processing`,
    { signal },
  );
}

export function getClassroomContentText(
  classroomId: string,
  folderId: string,
  contentId: string,
  signal?: AbortSignal,
): Promise<ClassroomContentText> {
  return apiFetch(
    `/api/classrooms/${classroomId}/folders/${folderId}/contents/${contentId}/text`,
    { signal },
  );
}

export function searchClassroomContent(
  classroomId: string,
  folderId: string,
  query: string,
  signal?: AbortSignal,
): Promise<ClassroomContent[]> {
  const params = new URLSearchParams({ q: query });
  return apiFetch(
    `/api/classrooms/${classroomId}/folders/${folderId}/contents/search?${params.toString()}`,
    { signal },
  );
}

export function updateContent(
  classroomId: string,
  folderId: string,
  contentId: string,
  payload: { title: string; description: string },
): Promise<ClassroomContent> {
  return apiFetch(
    `/api/classrooms/${classroomId}/folders/${folderId}/contents/${contentId}`,
    { method: "PATCH", body: payload },
  );
}

export function deleteContent(
  classroomId: string,
  folderId: string,
  contentId: string,
): Promise<void> {
  return apiFetch(
    `/api/classrooms/${classroomId}/folders/${folderId}/contents/${contentId}`,
    { method: "DELETE" },
  );
}

export function listInvites(classroomId: string): Promise<ClassroomInvite[]> {
  return apiFetch(`/api/classrooms/${classroomId}/invites`);
}

export function inviteByUsername(
  classroomId: string,
  username: string,
  role: Exclude<ClassroomRole, "owner">,
): Promise<ClassroomInvite> {
  return apiFetch(`/api/classrooms/${classroomId}/invites`, {
    method: "POST",
    body: { username, role },
  });
}

export function createInviteLink(
  classroomId: string,
  role: Exclude<ClassroomRole, "owner">,
): Promise<ClassroomInvite> {
  return apiFetch(`/api/classrooms/${classroomId}/invites/link`, {
    method: "POST",
    body: { role },
  });
}

export function revokeInvite(
  classroomId: string,
  inviteId: string,
): Promise<void> {
  return apiFetch(`/api/classrooms/${classroomId}/invites/${inviteId}`, {
    method: "DELETE",
  });
}

export function listMyInvites(): Promise<ClassroomInvite[]> {
  return apiFetch("/api/me/invites");
}

export function getInviteByCode(code: string): Promise<ClassroomInvitePreview> {
  return apiFetch(`/api/invites/${encodeURIComponent(code.trim())}`);
}

export function acceptInvite(inviteId: string): Promise<Classroom> {
  return apiFetch(`/api/invites/${inviteId}/accept`, { method: "POST" });
}

export function declineInvite(inviteId: string): Promise<void> {
  return apiFetch(`/api/invites/${inviteId}/decline`, { method: "POST" });
}
