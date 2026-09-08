// Decodifica só o payload de um JWT (sem verificar assinatura — o back já
// validou o token; aqui só extraímos claims para preencher o perfil do
// usuário localmente, já que /api/auth/login não retorna esses dados).
export interface AccessTokenClaims {
  sub: string;
  email?: string;
  preferred_username?: string;
  email_verified?: boolean;
}

export function decodeAccessTokenClaims(
  accessToken: string,
): AccessTokenClaims | null {
  const parts = accessToken.split(".");

  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    const claims = JSON.parse(json) as Partial<AccessTokenClaims>;

    if (typeof claims.sub !== "string") return null;

    return {
      sub: claims.sub,
      email: typeof claims.email === "string" ? claims.email : undefined,
      preferred_username:
        typeof claims.preferred_username === "string"
          ? claims.preferred_username
          : undefined,
      email_verified:
        typeof claims.email_verified === "boolean"
          ? claims.email_verified
          : undefined,
    };
  } catch {
    return null;
  }
}
