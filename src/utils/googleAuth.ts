import type { GoogleIssue, GoogleToken } from "@/types/Google";
import { clearGoogleTokens, readGoogleToken, writeGoogleToken } from "./googleStorage";

/**
 * Fachada única do acesso ao Google.
 *
 * Drive e Agenda nunca sabem de onde veio o token: pedem aqui. Trocar o modo
 * navegador pelo modo backend é registrar outro `GoogleAuthDriver` no boot —
 * exatamente a forma de `speech.ts` + `setSpeechDriver`.
 *
 * Por que dois modos: o cliente OAuth "Web application" do Google exige
 * `client_secret` no endpoint de token, então a troca de código puro-navegador
 * que o Spotify aceita é rejeitada aqui. O modo padrão contorna isso com o
 * token client do Google Identity Services, que devolve um access token direto
 * no navegador — sem segredo, com ~1 h de validade e **sem refresh token**.
 */

export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
export const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";
export const EMAIL_SCOPE = "https://www.googleapis.com/auth/userinfo.email";

// `drive.file` em vez de `drive.readonly` é deliberado: o readonly é escopo
// *restrito* e exigiria avaliação de segurança do Google para sair do modo de
// teste. Com o `drive.file` o app só enxerga o que o aluno escolher no Picker.
export const GOOGLE_SCOPES = [DRIVE_SCOPE, CALENDAR_SCOPE, EMAIL_SCOPE].join(
  " ",
);

export type GoogleAuthMode = "browser" | "backend";

export interface GoogleAuthDriver {
  readonly mode: GoogleAuthMode;
  /** Token válido sem nenhuma interação, ou null se precisar de consentimento. */
  silentToken: () => Promise<GoogleToken | null>;
  /** Abre o consentimento. Só pode ser chamado de dentro de um gesto do usuário. */
  interactiveToken: () => Promise<GoogleToken | null>;
  revoke: () => Promise<void>;
}

/** Erro com um motivo que a tela sabe traduzir, em vez de uma mensagem solta. */
export class GoogleError extends Error {
  issue: Exclude<GoogleIssue, null>;

  constructor(issue: Exclude<GoogleIssue, null>, message?: string) {
    super(message ?? issue);
    this.name = "GoogleError";
    this.issue = issue;
  }
}

function readEnv(value: string | undefined) {
  return value !== undefined && value.length > 0 ? value : null;
}

export function getClientId() {
  return readEnv(import.meta.env.VITE_GOOGLE_CLIENT_ID);
}

export function getApiKey() {
  return readEnv(import.meta.env.VITE_GOOGLE_API_KEY);
}

export function getAppId() {
  return readEnv(import.meta.env.VITE_GOOGLE_APP_ID);
}

export function getAuthMode(): GoogleAuthMode {
  return import.meta.env.VITE_GOOGLE_BACKEND === "true" ? "backend" : "browser";
}

/**
 * No modo navegador tudo depende do client id público. No modo backend as
 * credenciais moram no servidor e o front não tem como (nem deve) conferi-las.
 */
export function isConfigured() {
  return getAuthMode() === "backend" || getClientId() !== null;
}

/**
 * O Picker exige chave de API própria, que o modo backend não substitui: ele
 * roda no navegador do aluno nos dois modos.
 */
export function isDriveConfigured() {
  return isConfigured() && getApiKey() !== null;
}

/** Motor inerte: é o que responde no servidor e antes do registro do driver. */
const noopDriver: GoogleAuthDriver = {
  mode: "browser",
  silentToken: () => Promise.resolve(null),
  interactiveToken: () => Promise.resolve(null),
  revoke: () => Promise.resolve(),
};

let driver: GoogleAuthDriver = noopDriver;

/** O ponto de troca. Chamado uma vez, no `GoogleProvider`. */
export function setGoogleAuthDriver(next: GoogleAuthDriver) {
  driver = next;
}

export function hasScope(granted: string, scope: string) {
  return granted.split(" ").includes(scope);
}

/** Abaixo disto o token não sobrevive à requisição que está prestes a sair. */
const EXPIRY_MARGIN_MS = 60_000;

function isFresh(token: GoogleToken) {
  return token.expiresAt - Date.now() > EXPIRY_MARGIN_MS;
}

let pendingSilent: Promise<GoogleToken | null> | null = null;

/**
 * Renovação silenciosa, compartilhada entre chamadas concorrentes. Nunca abre
 * pop-up: pop-up sem clique é bloqueado por todo navegador.
 */
function silentToken(): Promise<GoogleToken | null> {
  pendingSilent ??= (async () => {
    try {
      const token = await driver.silentToken();

      // Sem renovação, o que estava guardado está morto. Apagar dispara o
      // evento que devolve a máquina de estados para "desconectado" — deixar
      // um token vencido no armazenamento faria a próxima visita insistir nele.
      if (token === null) {
        clearGoogleTokens();

        return null;
      }

      writeGoogleToken(token);

      return token;
    } catch {
      return null;
    } finally {
      pendingSilent = null;
    }
  })();

  return pendingSilent;
}

/**
 * A única porta. Devolve `null` quando o consentimento precisa ser pedido de
 * novo — quem chama mostra o estado com um botão "Reconectar", nunca um erro.
 */
export async function ensureAccessToken(): Promise<string | null> {
  const stored = readGoogleToken();

  if (stored !== null && isFresh(stored)) return stored.accessToken;

  const renewed = await silentToken();

  return renewed?.accessToken ?? null;
}

/** Token completo (com os escopos concedidos), sem interação. */
export async function restoreToken(): Promise<GoogleToken | null> {
  const stored = readGoogleToken();

  if (stored !== null && isFresh(stored)) return stored;

  return silentToken();
}

/** Só de dentro de um gesto do usuário: aqui é onde o pop-up abre. */
export async function requestConsent(): Promise<GoogleToken | null> {
  const token = await driver.interactiveToken();

  if (token !== null) writeGoogleToken(token);

  return token;
}

export async function revokeAccess(): Promise<void> {
  try {
    await driver.revoke();
  } finally {
    clearGoogleTokens();
  }
}
