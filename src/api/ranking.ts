import type {
  RankingEntry,
  RankingPage,
  RankingScope,
  RankingSummary,
  SeasonChampion,
} from "@/types/api/ranking";
import { readTokens } from "@/api/tokenStorage";
import { decodeAccessTokenClaims } from "@/utils/jwt";

import { apiFetch } from "./client";

/**
 * Ranking em três escopos, sobre o XP da temporada corrente (um mês civil).
 */

export interface RankingQuery {
  scope: RankingScope;
  /** Obrigatório quando `scope` é `"classroom"`. */
  classroomId?: string;
  page?: number;
  pageSize?: number;
}

/** Id do usuário logado, lido do mesmo JWT que o `apiFetch` já manda no `Authorization`. */
function currentUserId(): string | null {
  const tokens = readTokens();

  if (tokens === null) return null;

  return decodeAccessTokenClaims(tokens.accessToken)?.sub ?? null;
}

function buildQueryString(query: RankingQuery): string {
  const params = new URLSearchParams({ scope: query.scope });

  if (query.classroomId !== undefined) params.set("classroomId", query.classroomId);
  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.pageSize !== undefined) params.set("pageSize", String(query.pageSize));

  return params.toString();
}

interface LeaderboardEntryResponse {
  id: string;
  username: string;
  avatarUrl: string;
  xp: number;
  flashcards: number;
  quizzes: number;
  position: number | null;
}

interface LeaderboardResponse {
  entries: LeaderboardEntryResponse[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

function toRankingEntry(
  entry: LeaderboardEntryResponse,
  callerId: string | null,
): RankingEntry {
  return {
    position: entry.position,
    user: { id: entry.id, username: entry.username, displayName: entry.username, avatarUrl: entry.avatarUrl, xp: entry.xp },
    xp: entry.xp,
    flashcards: entry.flashcards,
    quizzes: entry.quizzes,
    isCurrentUser: entry.id === callerId,
  };
}

export function getRanking(query: RankingQuery): Promise<RankingPage> {
  return apiFetch<LeaderboardResponse>(`/api/ranking?${buildQueryString(query)}`).then(
    (response) => {
      const callerId = currentUserId();

      return {
        entries: response.entries.map((entry) => toRankingEntry(entry, callerId)),
        total: response.total,
        page: response.page,
        pageSize: response.pageSize,
        hasMore: response.hasMore,
      };
    },
  );
}

interface RankingSummaryResponse {
  seasonId: string;
  startsAt: string;
  endsAt: string;
  remainingSeconds: number;
  position: number | null;
  xp: number;
  flashcards: number;
  quizzes: number;
  total: number;
}

/** Cabeçalho do ranking: temporada, posição e atividade do usuário atual. */
export function getRankingSummary(query: RankingQuery): Promise<RankingSummary> {
  return apiFetch<RankingSummaryResponse>(
    `/api/ranking/summary?${buildQueryString(query)}`,
  ).then((response) => ({
    season: {
      id: response.seasonId,
      startsAt: response.startsAt,
      endsAt: response.endsAt,
    },
    position: response.position,
    xp: response.xp,
    flashcards: response.flashcards,
    quizzes: response.quizzes,
    total: response.total,
  }));
}

interface ChampionResponse {
  seasonId: string;
  scope: RankingScope;
  classroomId: string | null;
  user: { id: string; username: string; avatarUrl: string; xp: number; flashcards: number; quizzes: number };
}

/** Campeão da temporada anterior no escopo pedido. `null` se não houver. */
export function getPreviousChampion(
  query: RankingQuery,
): Promise<SeasonChampion | null> {
  return apiFetch<ChampionResponse | null>(
    `/api/ranking/champions/previous?${buildQueryString(query)}`,
  ).then((response) => {
    if (response === null) return null;

    return {
      seasonId: response.seasonId,
      scope: response.scope,
      classroomId: response.classroomId,
      user: {
        id: response.user.id,
        username: response.user.username,
        displayName: response.user.username,
        avatarUrl: response.user.avatarUrl,
        xp: response.user.xp,
      },
      xp: response.user.xp,
    };
  });
}
