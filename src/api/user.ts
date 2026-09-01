import { buildAvatarUrl, randomAvatarConfig } from "@/utils/avatar";
import { readAvatarUrl, writeAvatarUrl } from "@/utils/avatarStorage";

export interface WhoamiResponse {
  ownerId: string;
  /**
   * Nunca `null` no mock: um usuário sem avatar salvo ganha um sorteado e
   * persistido no primeiro `getWhoami`, para toda tela que exibe o avatar
   * (perfil, editor) mostrar a mesma imagem em vez de cair nas iniciais.
   * O tipo continua opcional porque o backend real pode devolver `null` para
   * um usuário que nunca montou um avatar.
   */
  avatarUrl: string | null;
}

/**
 * MOCK — o `GET /api/whoami` hoje devolve só o `ownerId`, sem `avatarUrl`, e não
 * existe endpoint para gravar o avatar. Até o backend ganhar esse campo, as duas
 * funções abaixo fazem o papel dele em cima do `localStorage`.
 *
 * Para ligar no backend de verdade, troque o corpo das duas por:
 *
 *   getWhoami   → return apiFetch<WhoamiResponse>("/api/whoami");
 *   updateAvatar→ return apiFetch<void>("/api/whoami", { method: "PATCH", body: { avatarUrl } });
 *
 * A assinatura e os tipos já estão na forma final, então nada mais muda. Ao
 * ligar no backend, o sorteio de primeiro acesso sai daqui — deve virar
 * responsabilidade do servidor, do jeito que já é para `ownerId`.
 */
const MOCK_OWNER_ID = "mock-owner";

export function getWhoami(): Promise<WhoamiResponse> {
  const stored = readAvatarUrl();
  const avatarUrl = stored ?? buildAvatarUrl(randomAvatarConfig());

  if (stored === null) writeAvatarUrl(avatarUrl);

  return Promise.resolve({ ownerId: MOCK_OWNER_ID, avatarUrl });
}

export function updateAvatar(avatarUrl: string): Promise<void> {
  writeAvatarUrl(avatarUrl);

  return Promise.resolve();
}
