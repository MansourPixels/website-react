import type { StoredSpotifyTokens } from "@/types/Spotify";

// Tokens do Spotify em localStorage: o mesmo compromisso honesto do resto do
// protótipo (ver authStorage.ts). Não é padrão de produção — em produção os
// tokens ficariam num cookie httpOnly emitido pelo servidor.
const TOKENS_KEY = "revi:spotify";

// Segredos efêmeros do PKCE. sessionStorage sobrevive ao redirect de página
// inteira e morre junto com a aba, que é exatamente o tempo de vida deles.
const VERIFIER_KEY = "revi:spotify:verificador";
const STATE_KEY = "revi:spotify:estado";
const RETURN_KEY = "revi:spotify:retorno";

export function readTokens(): StoredSpotifyTokens | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(TOKENS_KEY);

    if (raw === null) return null;

    const parsed = JSON.parse(raw) as Partial<StoredSpotifyTokens>;

    if (
      typeof parsed.accessToken !== "string" ||
      typeof parsed.refreshToken !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      !Number.isFinite(parsed.expiresAt)
    ) {
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      expiresAt: parsed.expiresAt,
      scope: typeof parsed.scope === "string" ? parsed.scope : "",
    };
  } catch {
    return null;
  }
}

export function writeTokens(tokens: StoredSpotifyTokens) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
  } catch {
    // Armazenamento cheio ou bloqueado: a conexão vale só para esta aba.
  }
}

export function clearTokens() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(TOKENS_KEY);
  } catch {
    // Sem acesso ao armazenamento: nada a limpar.
  }
}

export function writeHandshake(verifier: string, state: string, returnTo: string) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(VERIFIER_KEY, verifier);
    window.sessionStorage.setItem(STATE_KEY, state);
    window.sessionStorage.setItem(RETURN_KEY, returnTo);
  } catch {
    // Sem sessionStorage não há como concluir o PKCE com segurança.
  }
}

export function readHandshake() {
  if (typeof window === "undefined") {
    return { verifier: null, state: null, returnTo: null };
  }

  try {
    return {
      verifier: window.sessionStorage.getItem(VERIFIER_KEY),
      state: window.sessionStorage.getItem(STATE_KEY),
      returnTo: window.sessionStorage.getItem(RETURN_KEY),
    };
  } catch {
    return { verifier: null, state: null, returnTo: null };
  }
}

export function clearHandshake() {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(VERIFIER_KEY);
    window.sessionStorage.removeItem(STATE_KEY);
    window.sessionStorage.removeItem(RETURN_KEY);
  } catch {
    // Nada a limpar.
  }
}
