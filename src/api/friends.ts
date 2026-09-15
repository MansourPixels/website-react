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

import { ApiError } from "./client";
import { mockId, mockRequest } from "./mockBackend";

/**
 * Amigos. Cada função tem a forma que a chamada real vai ter — só o corpo é
 * mockado. Ver `src/api/mockBackend.ts`.
 */

export function toPublicUser(user: SocialUserRecord): PublicUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
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

/** Busca por username. Prefixo antes de "contém": quem digita o começo do nome espera vê-lo no topo. */
export function searchUsers(term: string): Promise<UserSearchResult[]> {
  return mockRequest((db, userId) => {
    const normalized = normalizeText(term).replace(/^@/, "");

    if (normalized.length < 2) return [];

    const matches = db.users.filter((user) => {
      const username = normalizeText(user.username);
      const displayName = normalizeText(user.displayName);

      return (
        username.includes(normalized) || displayName.includes(normalized)
      );
    });

    return matches
      .sort((a, b) => {
        const aStarts = normalizeText(a.username).startsWith(normalized);
        const bStarts = normalizeText(b.username).startsWith(normalized);

        if (aStarts !== bStarts) return aStarts ? -1 : 1;

        return a.username.localeCompare(b.username, "pt-BR");
      })
      .slice(0, 20)
      .map((user) => ({
        ...toPublicUser(user),
        friendship: friendshipStatus(db, userId, user.id),
      }));
  });
}

export function listFriends(): Promise<Friend[]> {
  return mockRequest((db, userId) =>
    db.friendships
      .filter(
        (friendship) =>
          friendship.userIdA === userId || friendship.userIdB === userId,
      )
      .map((friendship) => {
        const otherId =
          friendship.userIdA === userId
            ? friendship.userIdB
            : friendship.userIdA;

        return {
          ...toPublicUser(findUser(db, otherId)),
          friendsSince: friendship.createdAt,
        };
      })
      .sort((a, b) => b.xp - a.xp),
  );
}

export function listFriendRequests(): Promise<FriendRequest[]> {
  return mockRequest((db, userId) =>
    db.friendRequests
      .filter(
        (request) =>
          request.status === "pending" &&
          (request.toId === userId || request.fromId === userId),
      )
      .map((request) => ({
        id: request.id,
        user: toPublicUser(
          findUser(db, request.toId === userId ? request.fromId : request.toId),
        ),
        direction:
          request.toId === userId ? ("received" as const) : ("sent" as const),
        createdAt: request.createdAt,
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );
}

export function sendFriendRequest(targetUserId: string): Promise<FriendRequest> {
  return mockRequest((db, userId) => {
    if (targetUserId === userId) {
      throw new ApiError(400, "Você não pode adicionar a si mesmo.");
    }

    const target = findUser(db, targetUserId);

    if (areFriends(db, userId, targetUserId)) {
      throw new ApiError(409, "Vocês já são amigos.");
    }

    const existing = db.friendRequests.find(
      (request) =>
        request.status === "pending" &&
        ((request.fromId === userId && request.toId === targetUserId) ||
          (request.fromId === targetUserId && request.toId === userId)),
    );

    if (existing !== undefined) {
      throw new ApiError(409, "Já existe uma solicitação pendente.");
    }

    const request = {
      id: mockId("fr"),
      fromId: userId,
      toId: targetUserId,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
    };

    db.friendRequests.push(request);

    return {
      id: request.id,
      user: toPublicUser(target),
      direction: "sent" as const,
      createdAt: request.createdAt,
    };
  });
}

export function acceptFriendRequest(requestId: string): Promise<Friend> {
  return mockRequest((db, userId) => {
    const request = db.friendRequests.find((item) => item.id === requestId);

    if (request === undefined || request.status !== "pending") {
      throw new ApiError(404, "Solicitação não encontrada.");
    }

    if (request.toId !== userId) {
      throw new ApiError(403, "Só quem recebeu a solicitação pode aceitá-la.");
    }

    request.status = "accepted";

    const createdAt = new Date().toISOString();

    db.friendships.push({
      id: mockId("fs"),
      userIdA: request.fromId,
      userIdB: request.toId,
      createdAt,
    });

    return {
      ...toPublicUser(findUser(db, request.fromId)),
      friendsSince: createdAt,
    };
  });
}

export function declineFriendRequest(requestId: string): Promise<void> {
  return mockRequest((db, userId) => {
    const request = db.friendRequests.find((item) => item.id === requestId);

    if (request === undefined || request.status !== "pending") {
      throw new ApiError(404, "Solicitação não encontrada.");
    }

    if (request.toId !== userId) {
      throw new ApiError(403, "Só quem recebeu a solicitação pode recusá-la.");
    }

    request.status = "declined";
  });
}

export function cancelFriendRequest(requestId: string): Promise<void> {
  return mockRequest((db, userId) => {
    const request = db.friendRequests.find((item) => item.id === requestId);

    if (request === undefined || request.status !== "pending") {
      throw new ApiError(404, "Solicitação não encontrada.");
    }

    if (request.fromId !== userId) {
      throw new ApiError(403, "Só quem enviou a solicitação pode cancelá-la.");
    }

    request.status = "cancelled";
  });
}

export function removeFriend(targetUserId: string): Promise<void> {
  return mockRequest((db, userId) => {
    const index = db.friendships.findIndex(
      (friendship) =>
        (friendship.userIdA === userId &&
          friendship.userIdB === targetUserId) ||
        (friendship.userIdA === targetUserId && friendship.userIdB === userId),
    );

    if (index === -1) throw new ApiError(404, "Vocês não são amigos.");

    db.friendships.splice(index, 1);
  });
}
