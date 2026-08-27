import type {
  SpotifyIssue,
  SpotifyMeResponse,
  SpotifyNowPlaying,
  SpotifyPlayerResponse,
  SpotifyProfile,
} from "@/types/Spotify";
import { refreshTokens } from "@/utils/spotifyAuth";
import { clearTokens, readTokens } from "@/utils/spotifyStorage";

const API_BASE = "https://api.spotify.com/v1";

// Renova um pouco antes de expirar: uma requisição que sai com token vencido
// por dois segundos volta 401 e custa uma ida e volta a mais.
const REFRESH_MARGIN_MS = 60_000;

export type SpotifyResult<T> =
  | { ok: true; data: T | null }
  | { ok: false; issue: Exclude<SpotifyIssue, null>; retryAfter?: number };

interface SpotifyErrorBody {
  error?: { status?: number; message?: string; reason?: string };
}

async function readErrorReason(response: Response) {
  try {
    const body = (await response.json()) as SpotifyErrorBody;

    return {
      reason: body.error?.reason ?? "",
      message: body.error?.message ?? "",
    };
  } catch {
    return { reason: "", message: "" };
  }
}

async function getAccessToken(): Promise<string | null> {
  const tokens = readTokens();

  if (tokens === null) return null;

  if (tokens.expiresAt - Date.now() >= REFRESH_MARGIN_MS) {
    return tokens.accessToken;
  }

  const refreshed = await refreshTokens();

  if (refreshed === null) {
    clearTokens();

    return null;
  }

  return refreshed.accessToken;
}

async function request<T>(
  path: string,
  init: RequestInit,
  hasRetried: boolean,
): Promise<SpotifyResult<T>> {
  const accessToken = await getAccessToken();

  if (accessToken === null) return { ok: false, issue: "disconnected" };

  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch {
    return { ok: false, issue: "requestFailed" };
  }

  // 204: nada tocando, ou nenhum aparelho ativo. Não é erro.
  if (response.status === 204) return { ok: true, data: null };

  if (response.ok) {
    try {
      const text = await response.text();

      return { ok: true, data: text.length === 0 ? null : (JSON.parse(text) as T) };
    } catch {
      return { ok: true, data: null };
    }
  }

  if (response.status === 401) {
    if (hasRetried) {
      clearTokens();

      return { ok: false, issue: "disconnected" };
    }

    const refreshed = await refreshTokens();

    if (refreshed === null) {
      clearTokens();

      return { ok: false, issue: "disconnected" };
    }

    return request<T>(path, init, true);
  }

  if (response.status === 429) {
    const header = response.headers.get("Retry-After");
    const retryAfter = header === null ? 5 : Number.parseInt(header, 10);

    // Nunca retentar em laço aqui: é assim que se ganha um bloqueio temporário.
    return {
      ok: false,
      issue: "rateLimited",
      retryAfter: Number.isFinite(retryAfter) ? retryAfter : 5,
    };
  }

  const { reason, message } = await readErrorReason(response);

  if (response.status === 403) {
    if (reason === "PREMIUM_REQUIRED") return { ok: false, issue: "notPremium" };

    // "Restriction violated" costuma ser dar play no que já está tocando, ou
    // pause no que já está pausado. O estado desejado já é o estado atual.
    if (message.includes("Restriction violated")) return { ok: true, data: null };
  }

  if (response.status === 404 && reason === "NO_ACTIVE_DEVICE") {
    return { ok: false, issue: "noDevice" };
  }

  if (response.status === 404) return { ok: false, issue: "noDevice" };

  return { ok: false, issue: "requestFailed" };
}

export function spotifyFetch<T>(path: string, init: RequestInit = {}) {
  return request<T>(path, init, false);
}

export async function fetchProfile(): Promise<SpotifyProfile | null> {
  const result = await spotifyFetch<SpotifyMeResponse>("/me");

  if (!result.ok || result.data === null) return null;

  return {
    displayName: result.data.display_name ?? "Conta do Spotify",
    isPremium: result.data.product === "premium",
    imageUrl: result.data.images?.[0]?.url ?? null,
  };
}

export async function fetchNowPlaying(): Promise<
  SpotifyResult<SpotifyNowPlaying>
> {
  const result = await spotifyFetch<SpotifyPlayerResponse>("/me/player");

  if (!result.ok) return result;

  const player = result.data;

  if (player === null || player.item === null || player.item === undefined) {
    return { ok: true, data: null };
  }

  return {
    ok: true,
    data: {
      trackName: player.item.name,
      artistName:
        player.item.artists?.map(({ name }) => name).join(", ") ?? "",
      albumImageUrl: player.item.album?.images?.[0]?.url ?? null,
      deviceName: player.device?.name ?? null,
      isPlaying: player.is_playing,
    },
  };
}

/**
 * Sem corpo, `play` apenas retoma o que já está no aparelho ativo. Se o
 * Spotify nunca tocou nada ali, não há o que retomar — daí o 404.
 */
export function startPlayback() {
  return spotifyFetch<null>("/me/player/play", { method: "PUT" });
}

export function pausePlayback() {
  return spotifyFetch<null>("/me/player/pause", { method: "PUT" });
}
