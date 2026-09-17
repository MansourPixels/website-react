import type { GoogleToken } from "@/types/Google";

const TOKEN_KEY = "revi:google";

const STATE_KEY = "revi:google:estado";
const RETURN_KEY = "revi:google:retorno";

// O AuthContext limpa o token do Google ao sair da conta, e o GoogleProvider
// precisa saber disso para não continuar exibindo "conectado". Mesmo truque do
// AUTH_EXPIRED_EVENT: um evento evita a dependência circular entre o utilitário
// de armazenamento e o contexto.
export const GOOGLE_CLEARED_EVENT = "revi:google-cleared";

export function readGoogleToken(): GoogleToken | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(TOKEN_KEY);

    if (raw === null) return null;

    const parsed = JSON.parse(raw) as Partial<GoogleToken>;

    if (
      typeof parsed.accessToken !== "string" ||
      parsed.accessToken.length === 0 ||
      typeof parsed.expiresAt !== "number" ||
      !Number.isFinite(parsed.expiresAt)
    ) {
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      expiresAt: parsed.expiresAt,
      scope: typeof parsed.scope === "string" ? parsed.scope : "",
    };
  } catch {
    return null;
  }
}

export function writeGoogleToken(token: GoogleToken) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
  } catch {
    // Armazenamento cheio ou bloqueado: a conexão vale só nesta aba.
  }
}

export function clearGoogleTokens() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(STATE_KEY);
    window.sessionStorage.removeItem(RETURN_KEY);
  } catch {
    // Sem armazenamento não há o que limpar.
  }

  window.dispatchEvent(new Event(GOOGLE_CLEARED_EVENT));
}

/** Só o modo backend usa: o redirect precisa saber de onde o aluno saiu. */
export function writeGoogleHandshake(state: string, returnTo: string) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(STATE_KEY, state);
    window.sessionStorage.setItem(RETURN_KEY, returnTo);
  } catch {
    // Sem sessionStorage o callback cai no destino padrão.
  }
}

export function readGoogleHandshake() {
  if (typeof window === "undefined") return { state: null, returnTo: null };

  try {
    return {
      state: window.sessionStorage.getItem(STATE_KEY),
      returnTo: window.sessionStorage.getItem(RETURN_KEY),
    };
  } catch {
    return { state: null, returnTo: null };
  }
}

export function clearGoogleHandshake() {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(STATE_KEY);
    window.sessionStorage.removeItem(RETURN_KEY);
  } catch {
    // Idem.
  }
}
