import type { SocialDatabase } from "@/mocks/social/schema";
import type { PublicProfile, SharedClassroom } from "@/types/api/profile";

import {
  findUser,
  findUserByUsername,
  friendIdsOf,
  friendshipStatus,
  toPublicUser,
} from "./friends";
import { mockRequest } from "./mockBackend";
import { rankUsers } from "./ranking";

/**
 * Perfil público de um usuário, por username.
 *
 * Tudo aqui é resolvido em relação a quem chama, e nada é exposto além do
 * necessário: turmas apenas quando compartilhadas, amigos apenas quando em
 * comum. Ver `src/types/api/profile.ts`.
 */

/** Id da solicitação pendente entre os dois, se houver. */
function pendingRequestIdBetween(
  db: SocialDatabase,
  currentUserId: string,
  otherId: string,
): string | null {
  const pending = db.friendRequests.find(
    (request) =>
      request.status === "pending" &&
      ((request.fromId === currentUserId && request.toId === otherId) ||
        (request.fromId === otherId && request.toId === currentUserId)),
  );

  return pending?.id ?? null;
}

function sharedClassroomsBetween(
  db: SocialDatabase,
  currentUserId: string,
  otherId: string,
): SharedClassroom[] {
  const mine = new Set(
    db.members
      .filter((member) => member.userId === currentUserId)
      .map((member) => member.classroomId),
  );

  return db.members
    .filter(
      (member) => member.userId === otherId && mine.has(member.classroomId),
    )
    .map((member) => db.classrooms.find((item) => item.id === member.classroomId))
    .filter((classroom) => classroom !== undefined)
    .map((classroom) => ({
      id: classroom.id,
      name: classroom.name,
      color: classroom.color,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export function getPublicProfile(username: string): Promise<PublicProfile> {
  return mockRequest((db, userId) => {
    const target = findUserByUsername(db, username);
    const isSelf = target.id === userId;

    // A posição sai do mesmo `rankUsers` que alimenta o /ranking, para os dois
    // lugares nunca discordarem sobre o número.
    const global = rankUsers(db.users, userId);
    const entry = global.find((item) => item.user.id === target.id) ?? null;

    const targetFriendIds = friendIdsOf(db, target.id);
    const myFriendIds = new Set(friendIdsOf(db, userId));

    return {
      user: toPublicUser(target),
      friendship: friendshipStatus(db, userId, target.id),
      pendingRequestId: isSelf
        ? null
        : pendingRequestIdBetween(db, userId, target.id),
      flashcards: target.flashcards,
      quizzes: target.quizzes,
      // Quem não pontuou fica sem posição em vez de aparecer no fim da fila.
      globalPosition: entry !== null && entry.xp > 0 ? entry.position : null,
      globalTotal: global.length,
      friendCount: targetFriendIds.length,
      mutualFriends: isSelf
        ? []
        : targetFriendIds
            .filter((id) => myFriendIds.has(id))
            .map((id) => toPublicUser(findUser(db, id)))
            .sort((a, b) => b.xp - a.xp),
      sharedClassrooms: isSelf
        ? []
        : sharedClassroomsBetween(db, userId, target.id),
    };
  });
}
