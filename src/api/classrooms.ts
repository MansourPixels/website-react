import type {
  ClassroomContentRecord,
  ClassroomRecord,
  ReviMaterialRecord,
  SocialDatabase,
} from "@/mocks/social/schema";
import type {
  Classroom,
  ClassroomContent,
  ClassroomContentKind,
  ClassroomFolder,
  ClassroomInvite,
  ClassroomInvitePreview,
  ClassroomMember,
  ClassroomRole,
} from "@/types/api/classroom";
import {
  canAddContent,
  canDeleteContent,
  canEditContent,
  canInviteMembers,
  canLeaveClassroom,
  canManageClassroom,
  canManageFolders,
  canManageMembers,
} from "@/utils/classroomPermissions";
import { normalizeText } from "@/utils/text";

import { ApiError } from "./client";
import { findUser, toPublicUser } from "./friends";
import { mockId, mockInviteCode, mockRequest } from "./mockBackend";

/**
 * Turmas: pastas, conteúdo, convites e membros.
 *
 * As regras de permissão são cobradas aqui, não na interface. As telas usam
 * `src/utils/classroomPermissions.ts` só para decidir o que mostrar — esconder
 * um botão não é autorização.
 */

function findClassroomRecord(
  db: SocialDatabase,
  classroomId: string,
): ClassroomRecord {
  const classroom = db.classrooms.find((item) => item.id === classroomId);

  if (classroom === undefined) {
    throw new ApiError(404, "Turma não encontrada.");
  }

  return classroom;
}

/**
 * Papel do usuário na turma. Quem não é membro recebe 404, não 403: quem foi
 * removido não deve nem confirmar que a turma existe.
 */
function requireRole(
  db: SocialDatabase,
  classroomId: string,
  userId: string,
): ClassroomRole {
  findClassroomRecord(db, classroomId);

  const member = db.members.find(
    (item) => item.classroomId === classroomId && item.userId === userId,
  );

  if (member === undefined) {
    throw new ApiError(404, "Turma não encontrada.");
  }

  return member.role;
}

function countMembers(db: SocialDatabase, classroomId: string): number {
  return db.members.filter((item) => item.classroomId === classroomId).length;
}

function countFolders(db: SocialDatabase, classroomId: string): number {
  return db.folders.filter((item) => item.classroomId === classroomId).length;
}

function toClassroom(
  db: SocialDatabase,
  record: ClassroomRecord,
  role: ClassroomRole,
): Classroom {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    color: record.color,
    ownerId: record.ownerId,
    ownerUsername: findUser(db, record.ownerId).username,
    role,
    memberCount: countMembers(db, record.id),
    folderCount: countFolders(db, record.id),
    createdAt: record.createdAt,
  };
}

function toContent(
  db: SocialDatabase,
  record: ClassroomContentRecord,
): ClassroomContent {
  return {
    id: record.id,
    classroomId: record.classroomId,
    folderId: record.folderId,
    kind: record.kind,
    title: record.title,
    description: record.description,
    authorId: record.authorId,
    authorUsername: findUser(db, record.authorId).username,
    fileName: record.fileName,
    fileSize: record.fileSize,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function toInvite(
  db: SocialDatabase,
  record: SocialDatabase["invites"][number],
): ClassroomInvite {
  const classroom = findClassroomRecord(db, record.classroomId);

  return {
    id: record.id,
    classroomId: record.classroomId,
    classroomName: classroom.name,
    classroomColor: classroom.color,
    code: record.code,
    role: record.role,
    status: record.status,
    invitedBy: toPublicUser(findUser(db, record.invitedById)),
    invitee:
      record.inviteeId === null
        ? null
        : toPublicUser(findUser(db, record.inviteeId)),
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
  };
}

// --- Turmas -----------------------------------------------------------------

export function listClassrooms(): Promise<Classroom[]> {
  return mockRequest((db, userId) =>
    db.members
      .filter((member) => member.userId === userId)
      .map((member) =>
        toClassroom(
          db,
          findClassroomRecord(db, member.classroomId),
          member.role,
        ),
      )
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
  );
}

export function getClassroom(classroomId: string): Promise<Classroom> {
  return mockRequest((db, userId) => {
    const role = requireRole(db, classroomId, userId);

    return toClassroom(db, findClassroomRecord(db, classroomId), role);
  });
}

export function createClassroom(payload: {
  name: string;
  description: string;
  color: string;
}): Promise<Classroom> {
  return mockRequest((db, userId) => {
    const createdAt = new Date().toISOString();
    const record: ClassroomRecord = {
      id: mockId("c"),
      name: payload.name,
      description: payload.description,
      color: payload.color,
      ownerId: userId,
      createdAt,
    };

    db.classrooms.push(record);
    db.members.push({
      id: mockId("cm"),
      classroomId: record.id,
      userId,
      role: "owner",
      joinedAt: createdAt,
    });

    return toClassroom(db, record, "owner");
  });
}

export function updateClassroom(
  classroomId: string,
  payload: { name: string; description: string; color: string },
): Promise<Classroom> {
  return mockRequest((db, userId) => {
    const role = requireRole(db, classroomId, userId);

    if (!canManageClassroom(role)) {
      throw new ApiError(403, "Só o dono pode editar a turma.");
    }

    const record = findClassroomRecord(db, classroomId);

    record.name = payload.name;
    record.description = payload.description;
    record.color = payload.color;

    return toClassroom(db, record, role);
  });
}

/** Exclui a turma inteira: pastas, conteúdos, convites e associações. */
export function deleteClassroom(classroomId: string): Promise<void> {
  return mockRequest((db, userId) => {
    const role = requireRole(db, classroomId, userId);

    if (!canManageClassroom(role)) {
      throw new ApiError(403, "Só o dono pode excluir a turma.");
    }

    db.classrooms = db.classrooms.filter((item) => item.id !== classroomId);
    db.members = db.members.filter((item) => item.classroomId !== classroomId);
    db.folders = db.folders.filter((item) => item.classroomId !== classroomId);
    db.contents = db.contents.filter(
      (item) => item.classroomId !== classroomId,
    );
    db.invites = db.invites.filter((item) => item.classroomId !== classroomId);
  });
}

/** Sair da turma: perde o acesso a tudo, mas o conteúdo criado permanece. */
export function leaveClassroom(classroomId: string): Promise<void> {
  return mockRequest((db, userId) => {
    const role = requireRole(db, classroomId, userId);

    if (!canLeaveClassroom(role)) {
      throw new ApiError(
        403,
        "O dono não pode sair da própria turma. Exclua a turma ou transfira a posse.",
      );
    }

    db.members = db.members.filter(
      (item) => !(item.classroomId === classroomId && item.userId === userId),
    );
  });
}

// --- Membros ----------------------------------------------------------------

export function listMembers(classroomId: string): Promise<ClassroomMember[]> {
  return mockRequest((db, userId) => {
    requireRole(db, classroomId, userId);

    const order: Record<ClassroomRole, number> = {
      owner: 0,
      editor: 1,
      viewer: 2,
    };

    return db.members
      .filter((member) => member.classroomId === classroomId)
      .map((member) => ({
        id: member.id,
        classroomId: member.classroomId,
        user: toPublicUser(findUser(db, member.userId)),
        role: member.role,
        joinedAt: member.joinedAt,
      }))
      .sort(
        (a, b) =>
          order[a.role] - order[b.role] ||
          a.user.username.localeCompare(b.user.username, "pt-BR"),
      );
  });
}

export function updateMemberRole(
  classroomId: string,
  memberId: string,
  role: Exclude<ClassroomRole, "owner">,
): Promise<ClassroomMember> {
  return mockRequest((db, userId) => {
    const myRole = requireRole(db, classroomId, userId);

    if (!canManageMembers(myRole)) {
      throw new ApiError(403, "Só o dono pode alterar permissões.");
    }

    const member = db.members.find(
      (item) => item.id === memberId && item.classroomId === classroomId,
    );

    if (member === undefined) {
      throw new ApiError(404, "Membro não encontrado.");
    }

    if (member.role === "owner") {
      throw new ApiError(400, "O papel do dono não pode ser alterado.");
    }

    member.role = role;

    return {
      id: member.id,
      classroomId: member.classroomId,
      user: toPublicUser(findUser(db, member.userId)),
      role: member.role,
      joinedAt: member.joinedAt,
    };
  });
}

export function removeMember(
  classroomId: string,
  memberId: string,
): Promise<void> {
  return mockRequest((db, userId) => {
    const myRole = requireRole(db, classroomId, userId);

    if (!canManageMembers(myRole)) {
      throw new ApiError(403, "Só o dono pode remover membros.");
    }

    const member = db.members.find(
      (item) => item.id === memberId && item.classroomId === classroomId,
    );

    if (member === undefined) {
      throw new ApiError(404, "Membro não encontrado.");
    }

    if (member.role === "owner") {
      throw new ApiError(400, "O dono não pode ser removido da turma.");
    }

    db.members = db.members.filter((item) => item.id !== memberId);
  });
}

// --- Pastas -----------------------------------------------------------------

export function listFolders(classroomId: string): Promise<ClassroomFolder[]> {
  return mockRequest((db, userId) => {
    requireRole(db, classroomId, userId);

    return db.folders
      .filter((folder) => folder.classroomId === classroomId)
      .map((folder) => ({
        id: folder.id,
        classroomId: folder.classroomId,
        name: folder.name,
        color: folder.color,
        contentCount: db.contents.filter(
          (content) => content.folderId === folder.id,
        ).length,
        createdAt: folder.createdAt,
      }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  });
}

export function getFolder(
  classroomId: string,
  folderId: string,
): Promise<ClassroomFolder> {
  return mockRequest((db, userId) => {
    requireRole(db, classroomId, userId);

    const folder = db.folders.find(
      (item) => item.id === folderId && item.classroomId === classroomId,
    );

    if (folder === undefined) {
      throw new ApiError(404, "Pasta não encontrada.");
    }

    return {
      id: folder.id,
      classroomId: folder.classroomId,
      name: folder.name,
      color: folder.color,
      contentCount: db.contents.filter(
        (content) => content.folderId === folder.id,
      ).length,
      createdAt: folder.createdAt,
    };
  });
}

export function createFolder(
  classroomId: string,
  payload: { name: string; color: string },
): Promise<ClassroomFolder> {
  return mockRequest((db, userId) => {
    const role = requireRole(db, classroomId, userId);

    if (!canManageFolders(role)) {
      throw new ApiError(403, "Só o dono da turma pode criar pastas.");
    }

    const folder = {
      id: mockId("cf"),
      classroomId,
      name: payload.name,
      color: payload.color,
      createdAt: new Date().toISOString(),
    };

    db.folders.push(folder);

    return { ...folder, contentCount: 0 };
  });
}

export function updateFolder(
  classroomId: string,
  folderId: string,
  payload: { name: string; color: string },
): Promise<ClassroomFolder> {
  return mockRequest((db, userId) => {
    const role = requireRole(db, classroomId, userId);

    if (!canManageFolders(role)) {
      throw new ApiError(403, "Só o dono da turma pode editar pastas.");
    }

    const folder = db.folders.find(
      (item) => item.id === folderId && item.classroomId === classroomId,
    );

    if (folder === undefined) {
      throw new ApiError(404, "Pasta não encontrada.");
    }

    folder.name = payload.name;
    folder.color = payload.color;

    return {
      ...folder,
      contentCount: db.contents.filter(
        (content) => content.folderId === folder.id,
      ).length,
    };
  });
}

export function deleteFolder(
  classroomId: string,
  folderId: string,
): Promise<void> {
  return mockRequest((db, userId) => {
    const role = requireRole(db, classroomId, userId);

    if (!canManageFolders(role)) {
      throw new ApiError(403, "Só o dono da turma pode excluir pastas.");
    }

    db.folders = db.folders.filter((item) => item.id !== folderId);
    db.contents = db.contents.filter((item) => item.folderId !== folderId);
  });
}

// --- Conteúdo ---------------------------------------------------------------

export function listContents(
  classroomId: string,
  folderId: string,
): Promise<ClassroomContent[]> {
  return mockRequest((db, userId) => {
    requireRole(db, classroomId, userId);

    return db.contents
      .filter(
        (content) =>
          content.classroomId === classroomId && content.folderId === folderId,
      )
      .map((content) => toContent(db, content))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });
}

export interface CreateContentPayload {
  kind: ClassroomContentKind;
  title: string;
  description: string;
  /** Só para `pdf` e `image`: o arquivo em si não é guardado no mock. */
  fileName?: string;
  fileSize?: number;
}

export function createContent(
  classroomId: string,
  folderId: string,
  payload: CreateContentPayload,
): Promise<ClassroomContent> {
  return mockRequest((db, userId) => {
    const role = requireRole(db, classroomId, userId);

    if (!canAddContent(role)) {
      throw new ApiError(
        403,
        "Membros não podem adicionar conteúdo nesta turma.",
      );
    }

    const folder = db.folders.find(
      (item) => item.id === folderId && item.classroomId === classroomId,
    );

    if (folder === undefined) {
      throw new ApiError(404, "Pasta não encontrada.");
    }

    const timestamp = new Date().toISOString();
    const record: ClassroomContentRecord = {
      id: mockId("cc"),
      classroomId,
      folderId,
      kind: payload.kind,
      title: payload.title,
      description: payload.description,
      authorId: userId,
      fileName: payload.fileName ?? null,
      fileSize: payload.fileSize ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    db.contents.push(record);

    return toContent(db, record);
  });
}

export function updateContent(
  classroomId: string,
  contentId: string,
  payload: { title: string; description: string },
): Promise<ClassroomContent> {
  return mockRequest((db, userId) => {
    const role = requireRole(db, classroomId, userId);
    const content = db.contents.find(
      (item) => item.id === contentId && item.classroomId === classroomId,
    );

    if (content === undefined) {
      throw new ApiError(404, "Conteúdo não encontrado.");
    }

    if (!canEditContent(role, content, userId)) {
      throw new ApiError(403, "Só o autor pode editar este conteúdo.");
    }

    content.title = payload.title;
    content.description = payload.description;
    content.updatedAt = new Date().toISOString();

    return toContent(db, content);
  });
}

export function deleteContent(
  classroomId: string,
  contentId: string,
): Promise<void> {
  return mockRequest((db, userId) => {
    const role = requireRole(db, classroomId, userId);
    const content = db.contents.find(
      (item) => item.id === contentId && item.classroomId === classroomId,
    );

    if (content === undefined) {
      throw new ApiError(404, "Conteúdo não encontrado.");
    }

    if (!canDeleteContent(role, content, userId)) {
      throw new ApiError(
        403,
        "Só o autor ou o dono da turma pode excluir este conteúdo.",
      );
    }

    db.contents = db.contents.filter((item) => item.id !== contentId);
  });
}

/** Catálogo do que o usuário já gerou no Revi, para a aba "Do Revi". */
export function listReviMaterials(): Promise<ReviMaterialRecord[]> {
  return mockRequest((db) => [...db.reviMaterials]);
}

// --- Convites ---------------------------------------------------------------

function assertNotMember(
  db: SocialDatabase,
  classroomId: string,
  targetUserId: string,
) {
  const already = db.members.some(
    (member) =>
      member.classroomId === classroomId && member.userId === targetUserId,
  );

  if (already) {
    throw new ApiError(409, "Esta pessoa já faz parte da turma.");
  }
}

/** Convites pendentes da turma — nominais e por link. Só o dono enxerga. */
export function listInvites(classroomId: string): Promise<ClassroomInvite[]> {
  return mockRequest((db, userId) => {
    const role = requireRole(db, classroomId, userId);

    if (!canInviteMembers(role)) {
      throw new ApiError(403, "Só o dono pode ver os convites da turma.");
    }

    return db.invites
      .filter(
        (invite) =>
          invite.classroomId === classroomId && invite.status === "pending",
      )
      .map((invite) => toInvite(db, invite))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });
}

export function inviteByUsername(
  classroomId: string,
  username: string,
  role: Exclude<ClassroomRole, "owner">,
): Promise<ClassroomInvite> {
  return mockRequest((db, userId) => {
    const myRole = requireRole(db, classroomId, userId);

    if (!canInviteMembers(myRole)) {
      throw new ApiError(403, "Só o dono pode convidar para a turma.");
    }

    const normalized = normalizeText(username).replace(/^@/, "");
    const target = db.users.find(
      (user) => normalizeText(user.username) === normalized,
    );

    if (target === undefined) {
      throw new ApiError(404, `Não encontramos o usuário @${username}.`);
    }

    assertNotMember(db, classroomId, target.id);

    const duplicated = db.invites.some(
      (invite) =>
        invite.classroomId === classroomId &&
        invite.inviteeId === target.id &&
        invite.status === "pending",
    );

    if (duplicated) {
      throw new ApiError(409, "Já existe um convite pendente para essa pessoa.");
    }

    const invite = {
      id: mockId("ci"),
      classroomId,
      code: mockInviteCode(),
      role,
      status: "pending" as const,
      invitedById: userId,
      inviteeId: target.id,
      createdAt: new Date().toISOString(),
      expiresAt: null,
    };

    db.invites.push(invite);

    return toInvite(db, invite);
  });
}

/** Gera um convite por link: vale para qualquer pessoa que chegar com o código. */
export function createInviteLink(
  classroomId: string,
  role: Exclude<ClassroomRole, "owner">,
): Promise<ClassroomInvite> {
  return mockRequest((db, userId) => {
    const myRole = requireRole(db, classroomId, userId);

    if (!canInviteMembers(myRole)) {
      throw new ApiError(403, "Só o dono pode gerar links de convite.");
    }

    const invite = {
      id: mockId("ci"),
      classroomId,
      code: mockInviteCode(),
      role,
      status: "pending" as const,
      invitedById: userId,
      inviteeId: null,
      createdAt: new Date().toISOString(),
      expiresAt: null,
    };

    db.invites.push(invite);

    return toInvite(db, invite);
  });
}

export function revokeInvite(
  classroomId: string,
  inviteId: string,
): Promise<void> {
  return mockRequest((db, userId) => {
    const myRole = requireRole(db, classroomId, userId);

    if (!canInviteMembers(myRole)) {
      throw new ApiError(403, "Só o dono pode revogar convites.");
    }

    const invite = db.invites.find(
      (item) => item.id === inviteId && item.classroomId === classroomId,
    );

    if (invite === undefined || invite.status !== "pending") {
      throw new ApiError(404, "Convite não encontrado.");
    }

    invite.status = "revoked";
  });
}

/** Convites nominais pendentes recebidos pelo usuário atual. */
export function listMyInvites(): Promise<ClassroomInvite[]> {
  return mockRequest((db, userId) =>
    db.invites
      .filter(
        (invite) => invite.inviteeId === userId && invite.status === "pending",
      )
      .map((invite) => toInvite(db, invite))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );
}

/** Prévia de um convite por código, antes de aceitar. */
export function getInviteByCode(
  code: string,
): Promise<ClassroomInvitePreview> {
  return mockRequest((db, userId) => {
    const normalized = code.trim().toUpperCase();
    const invite = db.invites.find(
      (item) => item.code.toUpperCase() === normalized,
    );

    if (invite === undefined) {
      throw new ApiError(404, "Convite não encontrado. Confira o código.");
    }

    if (invite.status !== "pending") {
      throw new ApiError(410, "Este convite não está mais válido.");
    }

    if (invite.expiresAt !== null && invite.expiresAt < new Date().toISOString()) {
      throw new ApiError(410, "Este convite expirou.");
    }

    if (invite.inviteeId !== null && invite.inviteeId !== userId) {
      throw new ApiError(403, "Este convite é de outra pessoa.");
    }

    assertNotMember(db, invite.classroomId, userId);

    const classroom = findClassroomRecord(db, invite.classroomId);

    return {
      invite: toInvite(db, invite),
      memberCount: countMembers(db, invite.classroomId),
      owner: toPublicUser(findUser(db, classroom.ownerId)),
    };
  });
}

export function acceptInvite(inviteId: string): Promise<Classroom> {
  return mockRequest((db, userId) => {
    const invite = db.invites.find((item) => item.id === inviteId);

    if (invite === undefined || invite.status !== "pending") {
      throw new ApiError(404, "Convite não encontrado.");
    }

    if (invite.inviteeId !== null && invite.inviteeId !== userId) {
      throw new ApiError(403, "Este convite é de outra pessoa.");
    }

    assertNotMember(db, invite.classroomId, userId);

    // Convite nominal se esgota no aceite; link segue valendo para os próximos.
    if (invite.inviteeId !== null) invite.status = "accepted";

    db.members.push({
      id: mockId("cm"),
      classroomId: invite.classroomId,
      userId,
      role: invite.role,
      joinedAt: new Date().toISOString(),
    });

    return toClassroom(
      db,
      findClassroomRecord(db, invite.classroomId),
      invite.role,
    );
  });
}

export function declineInvite(inviteId: string): Promise<void> {
  return mockRequest((db, userId) => {
    const invite = db.invites.find((item) => item.id === inviteId);

    if (invite === undefined || invite.status !== "pending") {
      throw new ApiError(404, "Convite não encontrado.");
    }

    if (invite.inviteeId !== userId) {
      throw new ApiError(403, "Este convite é de outra pessoa.");
    }

    invite.status = "declined";
  });
}
