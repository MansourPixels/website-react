import { createSocialSeed } from "@/mocks/social/seed";
import {
  SOCIAL_SEED_VERSION,
  type SocialDatabase,
} from "@/mocks/social/schema";

import { currentSeasonId, xpFromActivity } from "./ranking";

/**
 * Persistência do banco falso de Amigos, Ranking e Turmas.
 *
 * Segue o mesmo formato dos outros armazenamentos do app (`revi:preferencias`,
 * `revi:sessao-estudos`): leitura tolerante a lixo, escrita que engole erro de
 * cota, e nada que dependa de `window` no módulo.
 */
const SOCIAL_KEY = "revi:social";

export interface SocialIdentity {
  id: string;
  username: string;
}

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);

    if (raw === null) return null;

    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Armazenamento cheio ou bloqueado: a demo segue só nesta sessão.
  }
}

function isArrayOf(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Descarta o que estiver gravado quando o shape mudou (versão do seed) ou
 * quando outra conta entrou no mesmo navegador: as amizades e turmas semeadas
 * apontam para o id antigo e não fariam sentido para quem chegou agora.
 */
function isUsable(value: unknown, identity: SocialIdentity): boolean {
  const db = value as Partial<SocialDatabase> | null;

  if (db === null || typeof db !== "object") return false;
  if (db.version !== SOCIAL_SEED_VERSION) return false;
  if (db.ownerUserId !== identity.id) return false;

  return (
    isArrayOf(db.users) &&
    isArrayOf(db.friendships) &&
    isArrayOf(db.friendRequests) &&
    isArrayOf(db.classrooms) &&
    isArrayOf(db.members) &&
    isArrayOf(db.folders) &&
    isArrayOf(db.contents) &&
    isArrayOf(db.invites) &&
    isArrayOf(db.champions) &&
    isArrayOf(db.reviMaterials)
  );
}

/**
 * Virada de temporada: se o mês gravado não é o mês de hoje, o XP de todo
 * mundo zera e quem liderava vira campeão da temporada encerrada. É o que faz
 * o "reseta periodicamente" ser comportamento, e não só um texto na tela.
 */
function applySeasonRollover(db: SocialDatabase, now: Date): SocialDatabase {
  const seasonId = currentSeasonId(now);

  if (db.seasonId === seasonId) return db;

  const leader = [...db.users].sort(
    (a, b) => xpFromActivity(b) - xpFromActivity(a),
  )[0];

  return {
    ...db,
    seasonId,
    champions:
      leader === undefined
        ? db.champions
        : [
            ...db.champions,
            {
              seasonId: db.seasonId,
              scope: "global" as const,
              classroomId: null,
              userId: leader.id,
              xp: xpFromActivity(leader),
            },
          ],
    users: db.users.map((user) => ({ ...user, flashcards: 0, quizzes: 0 })),
  };
}

/**
 * Garante que o usuário logado exista na tabela de usuários do mock. É aqui
 * que a conta real (vinda do JWT) encontra o mundo fictício: sem isso ele não
 * apareceria no próprio ranking.
 */
function ensureCurrentUser(
  db: SocialDatabase,
  identity: SocialIdentity,
): SocialDatabase {
  const existing = db.users.find((user) => user.id === identity.id);

  if (existing === undefined) {
    return {
      ...db,
      users: [
        ...db.users,
        {
          id: identity.id,
          username: identity.username,
          displayName: identity.username,
          avatarUrl: null,
          flashcards: 0,
          quizzes: 0,
        },
      ],
    };
  }

  // O username pode ter mudado no backend desde a última visita.
  if (existing.username === identity.username) return db;

  return {
    ...db,
    users: db.users.map((user) =>
      user.id === identity.id
        ? { ...user, username: identity.username, displayName: identity.username }
        : user,
    ),
  };
}

export function readSocialDatabase(identity: SocialIdentity): SocialDatabase {
  const stored = readJson<unknown>(SOCIAL_KEY);

  if (!isUsable(stored, identity)) {
    const seeded = createSocialSeed(identity);

    writeJson(SOCIAL_KEY, seeded);

    return seeded;
  }

  const db = ensureCurrentUser(
    applySeasonRollover(stored as SocialDatabase, new Date()),
    identity,
  );

  return db;
}

export function writeSocialDatabase(db: SocialDatabase) {
  writeJson(SOCIAL_KEY, db);
}

/** Volta tudo ao seed — o botão "Restaurar dados de demonstração". */
export function resetSocialDatabase(identity: SocialIdentity): SocialDatabase {
  const seeded = createSocialSeed(identity);

  writeJson(SOCIAL_KEY, seeded);

  return seeded;
}
