import type { FriendshipStatus } from "@/types/api/friend";
import type { PublicProfile } from "@/types/api/profile";
import type { PublicUser } from "@/types/api/social";

import { apiFetch } from "./client";

/**
 * Perfil público de um usuário, por username.
 *
 * `flashcards`/`quizzes`/`globalPosition`/`globalTotal`/`sharedClassrooms` não
 * vêm do backend ainda (dependem das integrações de Ranking e Turmas — specs
 * `16`/`17`) — ficam de fora da resposta em vez de um valor inventado; a tela
 * de perfil público esconde as seções correspondentes quando `undefined`.
 */

interface PublicProfileResponse {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  xp: number;
  friendship: FriendshipStatus;
  pendingRequestId: string | null;
  friendCount: number;
  mutualFriends: PublicUser[];
}

export function getPublicProfile(username: string): Promise<PublicProfile> {
  return apiFetch<PublicProfileResponse>(
    `/api/users/${encodeURIComponent(username)}`,
  ).then((response) => ({
    user: {
      id: response.id,
      username: response.username,
      displayName: response.displayName,
      avatarUrl: response.avatarUrl,
      xp: response.xp,
    },
    friendship: response.friendship,
    pendingRequestId: response.pendingRequestId,
    friendCount: response.friendCount,
    mutualFriends: response.mutualFriends,
  }));
}
