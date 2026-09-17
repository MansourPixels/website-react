import type { GoogleToken } from "@/types/Google";
import {
  GOOGLE_SCOPES,
  GoogleError,
  getClientId,
  type GoogleAuthDriver,
} from "@/utils/googleAuth";
import { loadIdentityServices } from "@/utils/googleScripts";
import { readGoogleToken } from "@/utils/googleStorage";

/**
 * Driver padrão: Google Identity Services token client.
 *
 * Devolve um access token direto no navegador, sem `client_secret` e sem
 * refresh token. A consequência é que a conexão morre em ~1 h; o que segura a
 * sessão é o `prompt: "none"`, que renova em silêncio enquanto o aluno tiver
 * sessão Google ativa no navegador. É esse limite que motiva o modo backend
 * descrito em GOOGLE.md.
 */

let client: GoogleTokenClient | null = null;

interface PendingRequest {
  resolve: (token: GoogleToken | null) => void;
  reject: (error: unknown) => void;
  isSilent: boolean;
}

// O token client é único e os retornos chegam por callback global, então só
// pode haver um pedido em voo por vez.
let pending: PendingRequest | null = null;

function take() {
  const current = pending;

  pending = null;

  return current;
}

function toToken(response: GoogleTokenResponse): GoogleToken | null {
  if (response.access_token === undefined) return null;

  const seconds = Number(response.expires_in ?? 3600);

  return {
    accessToken: response.access_token,
    expiresAt:
      Date.now() + (Number.isFinite(seconds) ? seconds : 3600) * 1000,
    scope: response.scope ?? "",
  };
}

async function ensureClient(): Promise<GoogleTokenClient | null> {
  const clientId = getClientId();

  if (clientId === null) return null;

  await loadIdentityServices();

  client ??= google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: GOOGLE_SCOPES,
    callback: (response) => {
      const current = take();

      if (current === null) return;

      const token = toToken(response);

      if (token === null) {
        // O silencioso falhando é o caso normal (sessão Google ausente), não
        // um erro: quem chamou trata `null` mostrando o botão de reconectar.
        if (current.isSilent) {
          current.resolve(null);

          return;
        }

        current.reject(
          new GoogleError(
            response.error === "access_denied"
              ? "consentDenied"
              : "requestFailed",
            response.error_description,
          ),
        );

        return;
      }

      current.resolve(token);
    },
    error_callback: (error) => {
      const current = take();

      if (current === null) return;

      if (current.isSilent) {
        current.resolve(null);

        return;
      }

      current.reject(
        new GoogleError(
          error.type === "popup_failed_to_open"
            ? "popupBlocked"
            : error.type === "popup_closed"
              ? "consentDenied"
              : "requestFailed",
          error.message,
        ),
      );
    },
  });

  return client;
}

async function requestToken(prompt: "" | "none"): Promise<GoogleToken | null> {
  const tokenClient = await ensureClient();

  if (tokenClient === null) return null;

  return new Promise<GoogleToken | null>((resolve, reject) => {
    if (pending !== null) {
      // Já há um consentimento aberto: um segundo pedido abriria um segundo
      // pop-up sobre o primeiro.
      resolve(null);

      return;
    }

    pending = { resolve, reject, isSilent: prompt === "none" };

    tokenClient.requestAccessToken({ prompt });
  });
}

export const browserGisDriver: GoogleAuthDriver = {
  mode: "browser",
  silentToken: () => requestToken("none"),
  interactiveToken: () => requestToken(""),
  revoke: () =>
    new Promise<void>((resolve) => {
      const stored = readGoogleToken();

      if (stored === null || typeof google === "undefined") {
        resolve();

        return;
      }

      google.accounts.oauth2.revoke(stored.accessToken, () => resolve());
    }),
};
