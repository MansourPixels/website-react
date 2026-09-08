import type {
  Classroom,
  ClassroomContent,
  ClassroomContentKind,
  ClassroomFolder,
  ClassroomInvite,
  ClassroomInvitePreview,
  ClassroomMember,
  ClassroomRole,
  ReviMaterial,
} from "@/types/api/classroom";

import { apiFetch } from "./client";
import { listChildFolders, listMotherFolders } from "./folders";

/**
 * Turmas: pastas, conteúdo, convites e membros.
 *
 * As regras de permissão continuam vividas em `src/utils/classroomPermissions.ts`
 * só para decidir o que a interface mostra — a autorização de verdade é do
 * servidor.
 */

interface ContentResponse extends Omit<ClassroomContent, "classroomId" | "folderId"> {
  classroomFolderId: string;
  reviMaterialId: string | null;
}

function toContent(classroomId: string, response: ContentResponse): ClassroomContent {
  return {
    id: response.id,
    classroomId,
    folderId: response.classroomFolderId,
    kind: response.kind,
    title: response.title,
    description: response.description,
    author: response.author,
    fileName: response.fileName,
    fileSize: response.fileSize,
    createdAt: response.createdAt,
  };
}

// --- Turmas -----------------------------------------------------------------

export function listClassrooms(): Promise<Classroom[]> {
  return apiFetch<Classroom[]>("/api/classrooms");
}

export function getClassroom(classroomId: string): Promise<Classroom> {
  return apiFetch<Classroom>(`/api/classrooms/${classroomId}`);
}

export function createClassroom(payload: {
  name: string;
  description: string;
  color: string;
}): Promise<Classroom> {
  return apiFetch<Classroom>("/api/classrooms", { method: "POST", body: payload });
}

export function updateClassroom(
  classroomId: string,
  payload: { name: string; description: string; color: string },
): Promise<Classroom> {
  return apiFetch<Classroom>(`/api/classrooms/${classroomId}`, {
    method: "PATCH",
    body: payload,
  });
}

/** Exclui a turma inteira: pastas, conteúdos, convites e associações. */
export function deleteClassroom(classroomId: string): Promise<void> {
  return apiFetch<void>(`/api/classrooms/${classroomId}`, { method: "DELETE" });
}

/** Sair da turma: perde o acesso a tudo, mas o conteúdo criado permanece. */
export function leaveClassroom(classroomId: string): Promise<void> {
  return apiFetch<void>(`/api/classrooms/${classroomId}/leave`, { method: "POST" });
}

// --- Membros ----------------------------------------------------------------

export function listMembers(classroomId: string): Promise<ClassroomMember[]> {
  return apiFetch<ClassroomMember[]>(`/api/classrooms/${classroomId}/members`);
}

export function updateMemberRole(
  classroomId: string,
  memberId: string,
  role: Exclude<ClassroomRole, "owner">,
): Promise<ClassroomMember> {
  return apiFetch<ClassroomMember>(
    `/api/classrooms/${classroomId}/members/${memberId}`,
    { method: "PATCH", body: { role } },
  );
}

export function removeMember(
  classroomId: string,
  memberId: string,
): Promise<void> {
  return apiFetch<void>(`/api/classrooms/${classroomId}/members/${memberId}`, {
    method: "DELETE",
  });
}

// --- Pastas -----------------------------------------------------------------

export function listFolders(classroomId: string): Promise<ClassroomFolder[]> {
  return apiFetch<ClassroomFolder[]>(`/api/classrooms/${classroomId}/folders`);
}

export function getFolder(
  classroomId: string,
  folderId: string,
): Promise<ClassroomFolder> {
  return apiFetch<ClassroomFolder>(
    `/api/classrooms/${classroomId}/folders/${folderId}`,
  );
}

export function createFolder(
  classroomId: string,
  payload: { name: string; color: string },
): Promise<ClassroomFolder> {
  return apiFetch<ClassroomFolder>(`/api/classrooms/${classroomId}/folders`, {
    method: "POST",
    body: payload,
  });
}

export function updateFolder(
  classroomId: string,
  folderId: string,
  payload: { name: string; color: string },
): Promise<ClassroomFolder> {
  return apiFetch<ClassroomFolder>(
    `/api/classrooms/${classroomId}/folders/${folderId}`,
    { method: "PATCH", body: payload },
  );
}

export function deleteFolder(
  classroomId: string,
  folderId: string,
): Promise<void> {
  return apiFetch<void>(`/api/classrooms/${classroomId}/folders/${folderId}`, {
    method: "DELETE",
  });
}

// --- Conteúdo ---------------------------------------------------------------

function contentUrl(classroomId: string, folderId: string): string {
  return `/api/classrooms/${classroomId}/folders/${folderId}/contents`;
}

export function listContents(
  classroomId: string,
  folderId: string,
): Promise<ClassroomContent[]> {
  return apiFetch<ContentResponse[]>(contentUrl(classroomId, folderId)).then(
    (entries) => entries.map((entry) => toContent(classroomId, entry)),
  );
}

export interface CreateContentPayload {
  kind: ClassroomContentKind;
  title: string;
  description: string;
  /** Obrigatório para `flashcards`/`summary`/`quiz`/`mindmap` — é o `childFolderId` do material. */
  reviMaterialId?: string;
}

export function createContent(
  classroomId: string,
  folderId: string,
  payload: CreateContentPayload,
): Promise<ClassroomContent> {
  return apiFetch<ContentResponse>(contentUrl(classroomId, folderId), {
    method: "POST",
    body: payload,
  }).then((response) => toContent(classroomId, response));
}

export function uploadContent(
  classroomId: string,
  folderId: string,
  payload: {
    kind: Extract<ClassroomContentKind, "pdf" | "image">;
    title: string;
    description: string;
    file: File;
  },
): Promise<ClassroomContent> {
  const body = new FormData();

  body.set("file", payload.file);
  body.set("title", payload.title);
  body.set("description", payload.description);
  body.set("kind", payload.kind);

  return apiFetch<ContentResponse>(`${contentUrl(classroomId, folderId)}/upload`, {
    method: "POST",
    body,
  }).then((response) => toContent(classroomId, response));
}

export function updateContent(
  classroomId: string,
  folderId: string,
  contentId: string,
  payload: { title: string; description: string },
): Promise<ClassroomContent> {
  return apiFetch<ContentResponse>(
    `${contentUrl(classroomId, folderId)}/${contentId}`,
    { method: "PATCH", body: payload },
  ).then((response) => toContent(classroomId, response));
}

export function deleteContent(
  classroomId: string,
  folderId: string,
  contentId: string,
): Promise<void> {
  return apiFetch<void>(`${contentUrl(classroomId, folderId)}/${contentId}`, {
    method: "DELETE",
  });
}

const materialKindLabels: Record<ReviMaterial["kind"], string> = {
  flashcards: "Flash cards gerados no Revi",
  summary: "Resumo gerado no Revi",
  quiz: "Simulado gerado no Revi",
  mindmap: "Mapa mental gerado no Revi",
};

interface OwnerMaterialResponse {
  childFolderId: string;
  kinds: ReviMaterial["kind"][];
}

/**
 * Catálogo do que o usuário já gerou no Revi, para a aba "Do Revi". O backend
 * só sabe dizer "esta pasta tem flashcards/resumo/simulado/mapa mental" — o
 * nome de cada pasta vem de uma segunda consulta (pastas-mãe → pastas), já
 * que não existe um "buscar pasta por id" direto para isso.
 */
export async function listReviMaterials(): Promise<ReviMaterial[]> {
  const [materials, motherFolders] = await Promise.all([
    apiFetch<OwnerMaterialResponse[]>("/api/me/materials"),
    listMotherFolders(),
  ]);

  if (materials.length === 0) return [];

  const childFolderLists = await Promise.all(
    motherFolders.map((mother) => listChildFolders(mother.id)),
  );
  const folderNameById = new Map<string, string>();

  for (const folders of childFolderLists) {
    for (const folder of folders) folderNameById.set(folder.id, folder.name);
  }

  return materials.flatMap((material) =>
    material.kinds.map((kind) => ({
      id: `${material.childFolderId}:${kind}`,
      reviMaterialId: material.childFolderId,
      kind,
      title: folderNameById.get(material.childFolderId) ?? "Pasta",
      description: materialKindLabels[kind],
    })),
  );
}

// --- Convites ---------------------------------------------------------------

/** Convites pendentes da turma — nominais e por link. Só o dono enxerga. */
export function listInvites(classroomId: string): Promise<ClassroomInvite[]> {
  return apiFetch<ClassroomInvite[]>(`/api/classrooms/${classroomId}/invites`);
}

export function inviteByUsername(
  classroomId: string,
  username: string,
  role: Exclude<ClassroomRole, "owner">,
): Promise<ClassroomInvite> {
  return apiFetch<ClassroomInvite>(`/api/classrooms/${classroomId}/invites`, {
    method: "POST",
    body: { username, role },
  });
}

/** Gera um convite por link: vale para qualquer pessoa que chegar com o código. */
export function createInviteLink(
  classroomId: string,
  role: Exclude<ClassroomRole, "owner">,
): Promise<ClassroomInvite> {
  return apiFetch<ClassroomInvite>(
    `/api/classrooms/${classroomId}/invites/link`,
    { method: "POST", body: { role } },
  );
}

export function revokeInvite(
  classroomId: string,
  inviteId: string,
): Promise<void> {
  return apiFetch<void>(`/api/classrooms/${classroomId}/invites/${inviteId}`, {
    method: "DELETE",
  });
}

/** Convites nominais pendentes recebidos pelo usuário atual. */
export function listMyInvites(): Promise<ClassroomInvite[]> {
  return apiFetch<ClassroomInvite[]>("/api/me/invites");
}

/** Prévia de um convite por código, antes de aceitar. */
export function getInviteByCode(
  code: string,
): Promise<ClassroomInvitePreview> {
  return apiFetch<ClassroomInvitePreview>(
    `/api/invites/${encodeURIComponent(code)}`,
  );
}

export function acceptInvite(inviteId: string): Promise<Classroom> {
  return apiFetch<Classroom>(`/api/invites/${inviteId}/accept`, {
    method: "POST",
  });
}

export function declineInvite(inviteId: string): Promise<void> {
  return apiFetch<void>(`/api/invites/${inviteId}/decline`, { method: "POST" });
}
