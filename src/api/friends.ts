import type { SocialDatabase, SocialUserRecord } from "@/mocks/social/schema";
import type {
  Friend,
  FriendRequest,
  FriendshipStatus,
  UserSearchResult,
} from "@/types/api/friend";
import type { PublicUser } from "@/types/api/social";
import { xpFromActivity } from "@/utils/ranking";
import { normalizeText } from "@/utils/text";

import { apiFetch, ApiError } from "./client";

/**
 * Amigos. `ranking.ts`/`classrooms.ts` ainda usam as funções helper abaixo
 * (`findUser`, `toPublicUser`, `friendIdsOf`, `findUserByUsername`,
 * `areFriends`, `friendshipStatus`) para seus próprios mocks — não remover
 * até que as specs `16`/`17` também não precisem mais delas.
 */

export function toPublicUser(user: SocialUserRecord): PublicUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl ?? "",
    xp: xpFromActivity(user),
  };
}

export function findUser(
  db: SocialDatabase,
  userId: string,
): SocialUserRecord {
  const user = db.users.find((item) => item.id === userId);

  if (user === undefined) throw new ApiError(404, "Usuário não encontrado.");

  return user;
}

export function areFriends(
  db: SocialDatabase,
  a: string,
  b: string,
): boolean {
  return db.friendships.some(
    (friendship) =>
      (friendship.userIdA === a && friendship.userIdB === b) ||
      (friendship.userIdA === b && friendship.userIdB === a),
  );
}

export function friendIdsOf(db: SocialDatabase, userId: string): string[] {
  return db.friendships
    .filter(
      (friendship) =>
        friendship.userIdA === userId || friendship.userIdB === userId,
    )
    .map((friendship) =>
      friendship.userIdA === userId ? friendship.userIdB : friendship.userIdA,
    );
}

/**
 * Busca por username, com a mesma normalização de `searchUsers` — assim
 * `/usuarios/ANA.SOUZA` encontra `ana.souza`.
 */
export function findUserByUsername(
  db: SocialDatabase,
  username: string,
): SocialUserRecord {
  const normalized = normalizeText(username).replace(/^@/, "");
  const user = db.users.find(
    (item) => normalizeText(item.username) === normalized,
  );

  if (user === undefined) {
    throw new ApiError(404, `Não encontramos o usuário @${username}.`);
  }

  return user;
}

/**
 * Exportado para o perfil público reusar: duplicar esta regra faria a busca e o
 * perfil discordarem sobre o mesmo relacionamento.
 */
export function friendshipStatus(
  db: SocialDatabase,
  currentUserId: string,
  otherId: string,
): FriendshipStatus {
  if (currentUserId === otherId) return "self";
  if (areFriends(db, currentUserId, otherId)) return "friends";

  const pending = db.friendRequests.find(
    (request) =>
      request.status === "pending" &&
      ((request.fromId === currentUserId && request.toId === otherId) ||
        (request.fromId === otherId && request.toId === currentUserId)),
  );

  if (pending === undefined) return "none";

  return pending.fromId === currentUserId ? "request-sent" : "request-received";
}

/** Busca por username. O ranking prefixo-antes-de-contém é responsabilidade do servidor. */
export function searchUsers(term: string): Promise<UserSearchResult[]> {
  return apiFetch<UserSearchResult[]>(
    `/api/users/search?username=${encodeURIComponent(term)}`,
  );
}

interface FriendResponse {
  user: PublicUser;
  friendsSince: string;
}

export function listFriends(): Promise<Friend[]> {
  return apiFetch<FriendResponse[]>("/api/friends").then((entries) =>
    entries.map((entry) => ({ ...entry.user, friendsSince: entry.friendsSince })),
  );
}

export function listFriendRequests(): Promise<FriendRequest[]> {
  return apiFetch<FriendRequest[]>("/api/friends/requests");
}

export function sendFriendRequest(targetUserId: string): Promise<FriendRequest> {
  return apiFetch<FriendRequest>("/api/friends/requests", {
    method: "POST",
    body: { userId: targetUserId },
  });
}

/**
 * `POST /accept` só devolve a Friendship crua (sem dados do usuário) — o
 * outro lado já foi resolvido antes, em `request.user`/`profile.user`, então
 * a resposta é usada só para o `friendsSince` real.
 */
export function acceptFriendRequest(
  requestId: string,
  otherUser: PublicUser,
): Promise<Friend> {
  return apiFetch<{ createdAt: string }>(
    `/api/friends/requests/${requestId}/accept`,
    { method: "POST" },
  ).then((friendship) => ({ ...otherUser, friendsSince: friendship.createdAt }));
}

export function declineFriendRequest(requestId: string): Promise<void> {
  return apiFetch<void>(`/api/friends/requests/${requestId}/decline`, {
    method: "POST",
  });
}

export function cancelFriendRequest(requestId: string): Promise<void> {
  return apiFetch<void>(`/api/friends/requests/${requestId}`, {
    method: "DELETE",
  });
}

export function removeFriend(targetUserId: string): Promise<void> {
  return apiFetch<void>(`/api/friends/${targetUserId}`, { method: "DELETE" });
}
