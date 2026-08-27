import type { StoredSpotifyTokens } from "@/types/Spotify";

const TOKENS_KEY = "revi:spotify";

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
  }
}

export function clearTokens() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(TOKENS_KEY);
  } catch {
  }
}

export function writeHandshake(verifier: string, state: string, returnTo: string) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(VERIFIER_KEY, verifier);
    window.sessionStorage.setItem(STATE_KEY, state);
    window.sessionStorage.setItem(RETURN_KEY, returnTo);
  } catch {
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
  }
}
