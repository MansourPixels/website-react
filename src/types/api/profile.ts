import type { FriendshipStatus } from "./friend";
import type { PublicUser } from "./social";

/** Turma que o usuário atual e o perfil visitado têm em comum. */
export interface SharedClassroom {
  id: string;
  name: string;
  color: string;
}

/**
 * Perfil público de um usuário, resolvido **em relação a quem está olhando**:
 * `friendship`, `mutualFriends` e `sharedClassrooms` mudam conforme o
 * solicitante.
 *
 * O que está de fora é tão importante quanto o que está aqui: nem a lista
 * completa de turmas da pessoa, nem os amigos dela que não sejam em comum, nem
 * e-mail. Perfil público não é agenda aberta.
 */
export interface PublicProfile {
  user: PublicUser;
  friendship: FriendshipStatus;
  /** Id da solicitação pendente, para aceitar ou cancelar direto do perfil. */
  pendingRequestId: string | null;
  flashcards: number;
  quizzes: number;
  /** Posição no ranking global; `null` se ainda não pontuou na temporada. */
  globalPosition: number | null;
  globalTotal: number;
  friendCount: number;
  /** Vazio no próprio perfil — não faz sentido ser amigo em comum consigo. */
  mutualFriends: PublicUser[];
  sharedClassrooms: SharedClassroom[];
}
