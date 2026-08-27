import type { TokenPairResponse } from "@/types/api/auth";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const TOKENS_KEY = "revi:tokens";

export function readTokens(): TokenPair | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(TOKENS_KEY);

    if (raw === null) return null;

    const parsed = JSON.parse(raw) as Partial<TokenPair>;

    if (
      typeof parsed.accessToken !== "string" ||
      typeof parsed.refreshToken !== "string" ||
      typeof parsed.expiresAt !== "number"
    ) {
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

export function writeTokens(pair: TokenPairResponse): void {
  if (typeof window === "undefined") return;

  const tokens: TokenPair = {
    accessToken: pair.accessToken,
    refreshToken: pair.refreshToken,
    expiresAt: Date.now() + pair.expiresIn * 1000,
  };

  try {
    window.localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
  } catch {
    // Armazenamento cheio ou bloqueado: a sessão segue apenas em memória.
  }
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(TOKENS_KEY);
  } catch {
    // Sem acesso ao armazenamento: nada a limpar.
  }
}

// Considera o access token perto do fim antes do horário exato de expiração,
// para dar tempo de renová-lo antes que uma chamada real receba 401.
export function isAccessTokenExpiring(
  tokens: TokenPair,
  skewMs = 15_000,
): boolean {
  return Date.now() >= tokens.expiresAt - skewMs;
}
