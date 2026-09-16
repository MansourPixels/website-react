/**
 * Papel do membro, válido para a turma inteira — não há permissão por pasta.
 * As regras derivadas vivem em `src/utils/classroomPermissions.ts`.
 */
export type ClassroomRole = "owner" | "editor" | "viewer";

export interface ClassroomMemberUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

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
  user: ClassroomMemberUser;
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
  classroomFolderId: string;
  kind: ClassroomContentKind;
  title: string;
  description: string;
  author: ClassroomMemberUser;
  fileName: string | null;
  fileSize: number | null;
  reviMaterialId: string | null;
  createdAt: string;
}

export interface ClassroomContentProcessing {
  status: "pending" | "processing" | "completed" | "failed";
  textExtractedAt: string | null;
  error: string | null;
}

export interface ClassroomContentText {
  text: string | null;
  extractedAt: string | null;
}

export interface ClassroomDownloadUrl {
  url: string;
  expiresAt: string;
}

export interface ClassroomSummary {
  id: string;
  classroomFolderId: string;
  markdown: string;
  sourceVersion: number;
  generatedAt: string;
}

export interface ClassroomFlashcard {
  id: string;
  classroomFolderId: string;
  position: number;
  front: string;
  back: string;
  sourceVersion: number;
  generatedAt: string;
}

export type ClassroomQuizOption = "A" | "B" | "C" | "D";

export interface ClassroomQuizQuestion {
  id: string;
  classroomFolderId: string;
  position: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: ClassroomQuizOption;
  sourceVersion: number;
  generatedAt: string;
}

export interface ClassroomMindMapBranch {
  id: string;
  label: string;
  detalhe?: string;
  formula?: string;
  children?: ClassroomMindMapBranch[];
}

export interface ClassroomMindMap {
  id: string;
  classroomFolderId: string;
  raiz: ClassroomMindMapBranch;
  sourceVersion: number;
  generatedAt: string;
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
  invitedBy: ClassroomMemberUser;
  invitee: ClassroomMemberUser | null;
  createdAt: string;
  /** ISO 8601 ou `null` para link sem prazo — decisão pendente do backend. */
  expiresAt: string | null;
}

/** Prévia mínima exposta antes de entrar na turma. */
export interface ClassroomInvitePreview {
  inviteId: string;
  classroomId: string;
  classroomName: string;
  classroomColor: string;
  role: Exclude<ClassroomRole, "owner">;
  owner: ClassroomMemberUser;
  invitee: ClassroomMemberUser | null;
  memberCount: number;
}
