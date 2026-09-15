import type { PublicUser } from "./social";

/**
 * Relação entre o usuário atual e outro usuário, resolvida pelo servidor.
 * A tela de busca decide o rótulo do botão só a partir disto.
 */
export type FriendshipStatus =
  | "none"
  | "friends"
  | "request-sent"
  | "request-received"
  | "self";

export interface Friend extends PublicUser {
  /** ISO 8601. */
  friendsSince: string;
}

export type FriendRequestDirection = "received" | "sent";

export interface FriendRequest {
  id: string;
  /** O outro lado da solicitação — nunca o usuário atual. */
  user: PublicUser;
  direction: FriendRequestDirection;
  createdAt: string;
}

export interface UserSearchResult extends PublicUser {
  friendship: FriendshipStatus;
}
