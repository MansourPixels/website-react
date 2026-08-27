import type { TokenPairResponse } from "@/types/api/auth";

import {
  clearTokens,
  isAccessTokenExpiring,
  readTokens,
  writeTokens,
} from "./tokenStorage";

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

// Disparado quando uma renovação de sessão falha (refresh token inválido ou
// expirado): o AuthContext escuta esse evento para encerrar a sessão local
// sem precisar de uma dependência circular entre client.ts e AuthContext.tsx.
export const AUTH_EXPIRED_EVENT = "revi:auth-expired";

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  // false para os endpoints públicos de auth (register/login/refresh/
  // logout/forgot-password): nenhum token é anexado nem renovado.
  auth?: boolean;
  signal?: AbortSignal;
}

const GENERIC_ERROR_DETAIL =
  "Não foi possível completar a solicitação. Tente novamente.";

async function parseErrorDetail(response: Response): Promise<string> {
  try {
    const problem = (await response.json()) as { detail?: unknown };

    if (typeof problem.detail === "string" && problem.detail.length > 0) {
      return problem.detail;
    }
  } catch {
    // Corpo ausente ou não é JSON: cai na mensagem genérica abaixo.
  }

  return GENERIC_ERROR_DETAIL;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorDetail(response));
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();

  return (text.length === 0 ? undefined : JSON.parse(text)) as T;
}

function buildInit(
  method: string,
  body: unknown,
  accessToken: string | null,
): RequestInit {
  const headers: Record<string, string> = {};

  if (accessToken !== null) headers.Authorization = `Bearer ${accessToken}`;

  if (body instanceof FormData) {
    // Sem Content-Type manual: o browser define o boundary do multipart.
    return { method, headers, body };
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";

    return { method, headers, body: JSON.stringify(body) };
  }

  return { method, headers };
}

let refreshPromise: Promise<string> | null = null;

async function refreshTokenPair(
  refreshToken: string,
): Promise<TokenPairResponse> {
  const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  return parseResponse<TokenPairResponse>(response);
}

// Só uma renovação por vez: chamadas concorrentes que percebem o token
// expirado (ou tomam 401) reaproveitam a mesma promise em vez de disparar
// vários refreshes em paralelo (o refresh token do back é single-use).
async function performRefresh(): Promise<string> {
  if (refreshPromise !== null) return refreshPromise;

  refreshPromise = (async () => {
    const tokens = readTokens();

    if (tokens === null) {
      throw new ApiError(401, "Sessão expirada. Faça login novamente.");
    }

    try {
      const pair = await refreshTokenPair(tokens.refreshToken);

      writeTokens(pair);

      return pair.accessToken;
    } catch (error) {
      clearTokens();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
      throw error;
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, auth = true, signal } = options;

  let accessToken: string | null = null;

  if (auth) {
    const tokens = readTokens();

    if (tokens !== null && isAccessTokenExpiring(tokens)) {
      accessToken = await performRefresh();
    } else {
      accessToken = tokens?.accessToken ?? null;
    }
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...buildInit(method, body, accessToken),
    signal,
  });

  if (response.status === 401 && auth) {
    const newAccessToken = await performRefresh();
    const retryResponse = await fetch(`${BASE_URL}${path}`, {
      ...buildInit(method, body, newAccessToken),
      signal,
    });

    return parseResponse<T>(retryResponse);
  }

  return parseResponse<T>(response);
}
