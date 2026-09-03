import type { SocialDatabase } from "@/mocks/social/schema";
import { decodeAccessTokenClaims } from "@/utils/jwt";
import {
  readSocialDatabase,
  resetSocialDatabase,
  writeSocialDatabase,
  type SocialIdentity,
} from "@/utils/socialStorage";

import { ApiError } from "./client";
import { readTokens } from "./tokenStorage";

/**
 * Transporte falso das áreas sociais (Amigos, Ranking e Turmas), enquanto o
 * backend não existe. É o único módulo que sabe que os dados são mockados —
 * `friends.ts`, `ranking.ts` e `classrooms.ts` já têm a forma definitiva.
 *
 * Para trocar pelo backend real: substituir cada `mockRequest(...)` daqueles
 * três arquivos por `apiFetch(...)` e apagar este arquivo, mais
 * `src/utils/socialStorage.ts` e `src/mocks/social/`.
 */

/**
 * Latência artificial. Sem ela os estados de carregamento nunca aparecem, e a
 * tela mentiria sobre como vai se comportar contra uma rede de verdade.
 */
const LATENCY_MS = 320;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Identidade do usuário logado, lida do mesmo JWT que o `apiFetch` mandaria no
 * `Authorization`. Nenhum service recebe o id por parâmetro: as assinaturas já
 * são as que vão sobreviver à troca pelo backend.
 */
function currentIdentity(): SocialIdentity | null {
  const tokens = readTokens();

  if (tokens === null) return null;

  const claims = decodeAccessTokenClaims(tokens.accessToken);

  if (claims === null) return null;

  const username =
    claims.preferred_username ??
    (claims.email !== undefined ? claims.email.split("@")[0] : null) ??
    claims.sub.slice(0, 8);

  return { id: claims.sub, username };
}

function requireIdentity(): SocialIdentity {
  const identity = currentIdentity();

  if (identity === null) {
    throw new ApiError(401, "Sessão expirada. Faça login novamente.");
  }

  return identity;
}

/**
 * Executa um handler contra o banco falso e persiste o resultado.
 *
 * O handler recebe o banco mutável e o id do usuário atual, e pode lançar
 * `ApiError` — o mesmo erro que `apiFetch` lançaria, então as telas tratam
 * falha do mock e falha de rede pelo mesmo caminho.
 */
export async function mockRequest<T>(
  handler: (db: SocialDatabase, userId: string) => T,
): Promise<T> {
  await delay(LATENCY_MS);

  const identity = requireIdentity();
  const db = readSocialDatabase(identity);
  const result = handler(db, identity.id);

  writeSocialDatabase(db);

  return result;
}

/** Restaura o seed. Fica aqui junto do resto da costura descartável. */
export async function resetMockData(): Promise<void> {
  await delay(LATENCY_MS);

  resetSocialDatabase(requireIdentity());
}

/** Id curto e legível, no lugar do que o banco geraria. */
export function mockId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Código de convite curto, em maiúsculas, fácil de ditar em voz alta. */
export function mockInviteCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  return Array.from(
    { length: 8 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join("");
}
