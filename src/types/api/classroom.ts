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
 * `flashcards | summary | quiz` são materiais gerados dentro do Revi;
 * `pdf | image` são arquivos enviados de fora.
 */
export type ClassroomContentKind =
  | "flashcards"
  | "summary"
  | "quiz"
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
  authorId: string;
  authorUsername: string;
  /** Preenchidos só para `pdf` e `image`. */
  fileName: string | null;
  fileSize: number | null;
  createdAt: string;
  updatedAt: string;
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
  /** ISO 8601 ou `null` para link sem prazo — decisão pendente do backend. */
  expiresAt: string | null;
}

/** Prévia mostrada a quem abre um link de convite sem ser membro ainda. */
export interface ClassroomInvitePreview {
  invite: ClassroomInvite;
  memberCount: number;
  owner: PublicUser;
}
