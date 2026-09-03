import type {
  ClassroomContentKind,
  ClassroomInviteStatus,
  ClassroomRole,
} from "@/types/api/classroom";
import type { RankingScope } from "@/types/api/ranking";

/**
 * Esquema do banco falso que sustenta Amigos, Ranking e Turmas enquanto não há
 * backend. As tabelas são arrays planos com ids — os joins acontecem nos
 * services (`src/api/friends.ts`, `ranking.ts`, `classrooms.ts`), que é onde o
 * servidor faria o mesmo trabalho.
 *
 * Ao mudar qualquer shape aqui, suba `SOCIAL_SEED_VERSION`: o que estiver
 * gravado no navegador é descartado e re-semeado.
 */
export const SOCIAL_SEED_VERSION = 1;

export interface SocialUserRecord {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  /** Atividade da temporada corrente — o XP é derivado dela. */
  flashcards: number;
  quizzes: number;
}

export interface FriendshipRecord {
  id: string;
  /** Par não ordenado: a busca compara os dois lados. */
  userIdA: string;
  userIdB: string;
  createdAt: string;
}

export type FriendRequestRecordStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled";

export interface FriendRequestRecord {
  id: string;
  fromId: string;
  toId: string;
  status: FriendRequestRecordStatus;
  createdAt: string;
}

export interface ClassroomRecord {
  id: string;
  name: string;
  description: string;
  color: string;
  ownerId: string;
  createdAt: string;
}

export interface ClassroomMemberRecord {
  id: string;
  classroomId: string;
  userId: string;
  role: ClassroomRole;
  joinedAt: string;
}

export interface ClassroomFolderRecord {
  id: string;
  classroomId: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface ClassroomContentRecord {
  id: string;
  classroomId: string;
  folderId: string;
  kind: ClassroomContentKind;
  title: string;
  description: string;
  authorId: string;
  fileName: string | null;
  fileSize: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClassroomInviteRecord {
  id: string;
  classroomId: string;
  code: string;
  role: Exclude<ClassroomRole, "owner">;
  status: ClassroomInviteStatus;
  invitedById: string;
  /** `null` em convite por link: vale para quem chegar com o código. */
  inviteeId: string | null;
  createdAt: string;
  expiresAt: string | null;
}

export interface SeasonChampionRecord {
  seasonId: string;
  scope: RankingScope;
  classroomId: string | null;
  userId: string;
  xp: number;
}

/**
 * Catálogo do que o usuário já gerou no Revi, oferecido no seletor "Do Revi"
 * ao adicionar conteúdo numa pasta de turma. Mockado de propósito: a decisão de
 * produto foi não acoplar as turmas à API real de pastas/assuntos.
 */
export interface ReviMaterialRecord {
  id: string;
  kind: ClassroomContentKind;
  title: string;
  description: string;
}

export interface SocialDatabase {
  version: number;
  /**
   * Id do usuário para quem este banco foi semeado. Se outra conta entrar no
   * mesmo navegador, o banco é descartado — as amizades e turmas semeadas
   * apontam para o id antigo e não fariam sentido para a nova conta.
   */
  ownerUserId: string;
  /** Temporada gravada; se divergir do mês atual, o XP zera na leitura. */
  seasonId: string;
  users: SocialUserRecord[];
  friendships: FriendshipRecord[];
  friendRequests: FriendRequestRecord[];
  classrooms: ClassroomRecord[];
  members: ClassroomMemberRecord[];
  folders: ClassroomFolderRecord[];
  contents: ClassroomContentRecord[];
  invites: ClassroomInviteRecord[];
  champions: SeasonChampionRecord[];
  reviMaterials: ReviMaterialRecord[];
}
