import type {
  Friend,
  FriendRequest,
  UserSearchResult,
} from "@/types/api/friend";
import type { PublicUser } from "@/types/api/social";

import { apiFetch } from "./client";

/** Amigos: busca de usuários, solicitações, lista de amigos, remoção. */

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
