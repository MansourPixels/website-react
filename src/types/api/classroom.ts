import type { PublicUser } from "./social";

/**
 * Papel do membro, válido para a turma inteira — não há permissão por pasta.
 * As regras derivadas vivem em `src/utils/classroomPermissions.ts`.
 */
export type ClassroomRole = "owner" | "editor" | "viewer";

export interface Classroom {
  id: string;
  name: string;
  description: string;
  /** Hex de seis dígitos, no mesmo formato das pastas do Revi. */
  color: string;
  ownerId: string;
  ownerUsername: string;
  /** Papel do usuário atual nesta turma, já resolvido pelo servidor. */
  role: ClassroomRole;
  memberCount: number;
  folderCount: number;
  createdAt: string;
}

export interface ClassroomMember {
  /** Id da associação, não do usuário — é o que a gestão de membros manipula. */
  id: string;
  classroomId: string;
  user: PublicUser;
  role: ClassroomRole;
  joinedAt: string;
}

export interface ClassroomFolder {
  id: string;
  classroomId: string;
  name: string;
  color: string;
  contentCount: number;
  createdAt: string;
}

/**
 * `flashcards | summary | quiz | mindmap` são materiais gerados dentro do
 * Revi (referenciados por `reviMaterialId`); `pdf | image` são arquivos
 * enviados de fora.
 */
export type ClassroomContentKind =
  | "flashcards"
  | "summary"
  | "quiz"
  | "mindmap"
  | "pdf"
  | "image";

export interface ClassroomContent {
  id: string;
  classroomId: string;
  folderId: string;
  kind: ClassroomContentKind;
  title: string;
  description: string;
  /** Autor: define quem pode editar/excluir, junto com o dono da turma. */
  author: PublicUser;
  /** Preenchidos só para `pdf` e `image`. */
  fileName: string | null;
  fileSize: number | null;
  createdAt: string;
}

export type ClassroomInviteStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "revoked";

/**
 * Um convite nominal (`invitee` preenchido, criado a partir de um username) ou
 * um convite por link (`invitee` nulo, qualquer um com o código usa).
 */
export interface ClassroomInvite {
  id: string;
  classroomId: string;
  classroomName: string;
  classroomColor: string;
  code: string;
  role: Exclude<ClassroomRole, "owner">;
  status: ClassroomInviteStatus;
  invitedBy: PublicUser;
  invitee: PublicUser | null;
  createdAt: string;
  /** ISO 8601, ou `null` para um link sem prazo de expiração. */
  expiresAt: string | null;
}

/**
 * Prévia mostrada a quem abre um convite sem ser membro ainda — mais magra
 * que `ClassroomInvite`: sem `code`/`status`/`createdAt`/`expiresAt`/
 * `invitedBy`, que não fazem sentido expor a alguém de fora da turma.
 */
export interface ClassroomInvitePreview {
  inviteId: string;
  classroomId: string;
  classroomName: string;
  classroomColor: string;
  role: Exclude<ClassroomRole, "owner">;
  owner: PublicUser;
  /** Presente só em convite nominal — é o que diferencia de um convite por link. */
  invitee: PublicUser | null;
  memberCount: number;
}

/**
 * Um material do Revi (flashcards/resumo/simulado/mapa mental) disponível
 * para referenciar como conteúdo de turma. `id` identifica a combinação
 * pasta+tipo (`reviMaterialId` é a própria pasta — uma pasta pode ter mais
 * de um tipo de material gerado, cada um vira uma opção separada aqui).
 */
export interface ReviMaterial {
  id: string;
  reviMaterialId: string;
  kind: Extract<ClassroomContentKind, "flashcards" | "summary" | "quiz" | "mindmap">;
  title: string;
  description: string;
}
