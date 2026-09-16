import { ApiError, apiFetch } from "@/api/client";
import type { GoogleToken } from "@/types/Google";
import { GoogleError, type GoogleAuthDriver } from "@/utils/googleAuth";
import { writeGoogleHandshake } from "@/utils/googleStorage";

/**
 * Driver de backend, atrás de `VITE_GOOGLE_BACKEND=true`.
 *
 * O `revi-back` guarda o refresh token cifrado e cunha um access token a cada
 * pedido, então a conexão sobrevive à hora do modo navegador — e o servidor
 * passa a poder escrever na Agenda sem o app aberto. Os contratos estão em
 * GOOGLE.md; enquanto eles não existirem, este driver responde como
 * desconectado em vez de quebrar a tela.
 */

interface BackendTokenResponse {
  accessToken: string;
  /** Segundos. */
  expiresIn: number;
  scope: string;
}

interface AuthorizeUrlResponse {
  url: string;
}

function randomState() {
  return crypto.randomUUID();
}

function currentPath() {
  if (typeof window === "undefined") return "/perfil";

  return `${window.location.pathname}${window.location.search}`;
}

async function fetchToken(): Promise<GoogleToken | null> {
  try {
    const response = await apiFetch<BackendTokenResponse>("/api/google/token");

    return {
      accessToken: response.accessToken,
      expiresAt: Date.now() + response.expiresIn * 1000,
      scope: response.scope,
    };
  } catch (error) {
    // 401/403 = a conta Google não está ligada (ou foi revogada); 404 = o
    // endpoint ainda não subiu. Nos três casos é "desconectado", não falha.
    if (
      error instanceof ApiError &&
      (error.status === 401 || error.status === 403 || error.status === 404)
    ) {
      return null;
    }

    throw error;
  }
}

export const backendProxyDriver: GoogleAuthDriver = {
  mode: "backend",

  silentToken: fetchToken,

  interactiveToken: async () => {
    const state = randomState();
    const returnTo = currentPath();

    writeGoogleHandshake(state, returnTo);

    const { url } = await apiFetch<AuthorizeUrlResponse>(
      `/api/google/authorize-url?returnTo=${encodeURIComponent(returnTo)}`,
    );

    if (typeof window === "undefined") {
      throw new GoogleError("requestFailed");
    }

    window.location.assign(url);

    // O modo backend troca o pop-up por um redirect: esta aba está saindo, e
    // resolver aqui só faria a tela piscar "desconectado" antes de navegar.
    // Quem conclui a conexão é `/google/callback`.
    return new Promise<GoogleToken | null>(() => {});
  },

  revoke: async () => {
    await apiFetch<void>("/api/google/connection", { method: "DELETE" });
  },
};
