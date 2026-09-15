import type { SocialDatabase, SocialUserRecord } from "@/mocks/social/schema";
import type {
  RankingEntry,
  RankingPage,
  RankingScope,
  RankingSummary,
  SeasonChampion,
} from "@/types/api/ranking";
import {
  currentSeasonId,
  previousSeasonId,
  seasonEndsAt,
  seasonStartsAt,
  xpFromActivity,
} from "@/utils/ranking";

import { ApiError } from "./client";
import { findUser, friendIdsOf, toPublicUser } from "./friends";
import { mockRequest } from "./mockBackend";

/**
 * Ranking em três escopos, sobre o XP da temporada corrente (um mês civil).
 * A virada de temporada acontece na leitura do banco falso — ver
 * `applySeasonRollover` em `src/utils/socialStorage.ts`.
 */

export interface RankingQuery {
  scope: RankingScope;
  /** Obrigatório quando `scope` é `"classroom"`. */
  classroomId?: string;
  page?: number;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 20;

function membersOfClassroom(
  db: SocialDatabase,
  classroomId: string,
  userId: string,
): SocialUserRecord[] {
  const isMember = db.members.some(
    (member) => member.classroomId === classroomId && member.userId === userId,
  );

  if (!isMember) {
    throw new ApiError(403, "Você não faz parte desta turma.");
  }

  return db.members
    .filter((member) => member.classroomId === classroomId)
    .map((member) => findUser(db, member.userId));
}

/** Universo do escopo, já com o usuário atual incluído quando faz sentido. */
function scopedUsers(
  db: SocialDatabase,
  userId: string,
  query: RankingQuery,
): SocialUserRecord[] {
  if (query.scope === "global") return db.users;

  if (query.scope === "friends") {
    const ids = new Set([...friendIdsOf(db, userId), userId]);

    return db.users.filter((user) => ids.has(user.id));
  }

  if (query.classroomId === undefined) {
    throw new ApiError(400, "Informe a turma do ranking.");
  }

  return membersOfClassroom(db, query.classroomId, userId);
}

/**
 * Empate resolvido pelo username, para a ordem não dançar entre dois
 * carregamentos — posição que muda sozinha lê como bug.
 *
 * Exportado porque o perfil público mostra a posição global: se ele ordenasse
 * por conta própria, dois lugares do app discordariam sobre o mesmo número.
 */
export function rankUsers(
  users: SocialUserRecord[],
  userId: string,
): RankingEntry[] {
  return [...users]
    .sort((a, b) => {
      const diff = xpFromActivity(b) - xpFromActivity(a);

      if (diff !== 0) return diff;

      return a.username.localeCompare(b.username, "pt-BR");
    })
    .map((user, index) => ({
      position: index + 1,
      user: toPublicUser(user),
      xp: xpFromActivity(user),
      flashcards: user.flashcards,
      quizzes: user.quizzes,
      isCurrentUser: user.id === userId,
    }));
}

export function getRanking(query: RankingQuery): Promise<RankingPage> {
  return mockRequest((db, userId) => {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const entries = rankUsers(scopedUsers(db, userId, query), userId);
    const start = (page - 1) * pageSize;
    const slice = entries.slice(start, start + pageSize);

    return {
      entries: slice,
      total: entries.length,
      page,
      pageSize,
      hasMore: start + pageSize < entries.length,
    };
  });
}

/** Cabeçalho do ranking: temporada, posição e atividade do usuário atual. */
export function getRankingSummary(query: RankingQuery): Promise<RankingSummary> {
  return mockRequest((db, userId) => {
    const seasonId = currentSeasonId();
    const entries = rankUsers(scopedUsers(db, userId, query), userId);
    const mine = entries.find((entry) => entry.isCurrentUser) ?? null;

    return {
      season: {
        id: seasonId,
        startsAt: seasonStartsAt(seasonId).toISOString(),
        endsAt: seasonEndsAt(seasonId).toISOString(),
      },
      position: mine?.position ?? null,
      xp: mine?.xp ?? 0,
      flashcards: mine?.flashcards ?? 0,
      quizzes: mine?.quizzes ?? 0,
      total: entries.length,
    };
  });
}

/** Campeão da temporada anterior no escopo pedido. `null` se não houver. */
export function getPreviousChampion(
  query: RankingQuery,
): Promise<SeasonChampion | null> {
  return mockRequest((db, userId) => {
    // Valida o acesso ao escopo antes de devolver qualquer nome.
    scopedUsers(db, userId, query);

    const seasonId = previousSeasonId(currentSeasonId());
    const champion = db.champions.find(
      (item) =>
        item.seasonId === seasonId &&
        item.scope === query.scope &&
        item.classroomId === (query.classroomId ?? null),
    );

    if (champion === undefined) return null;

    return {
      seasonId: champion.seasonId,
      scope: champion.scope,
      classroomId: champion.classroomId,
      user: toPublicUser(findUser(db, champion.userId)),
      xp: champion.xp,
    };
  });
}
