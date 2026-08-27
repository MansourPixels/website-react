import type { SpotifyTokenResponse, StoredSpotifyTokens } from "@/types/Spotify";
import { readTokens, writeHandshake, writeTokens } from "@/utils/spotifyStorage";

const AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";

const SCOPES = [
  "user-modify-playback-state",
  "user-read-playback-state",
  "user-read-private",
].join(" ");

export function getClientId() {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;

  return clientId !== undefined && clientId.length > 0 ? clientId : null;
}

export function getRedirectUri() {
  if (typeof window === "undefined") return "";

  return `${window.location.origin}/spotify/callback`;
}

function base64Url(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomString(byteLength: number) {
  return base64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

async function createChallenge(verifier: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );

  return base64Url(new Uint8Array(digest));
}

export async function buildAuthorizeUrl(returnTo: string) {
  const clientId = getClientId();

  if (clientId === null) return null;

  const verifier = randomString(64);
  const state = randomString(16);
  const challenge = await createChallenge(verifier);

  writeHandshake(verifier, state, returnTo);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: getRedirectUri(),
    code_challenge_method: "S256",
    code_challenge: challenge,
    state,
    scope: SCOPES,
  });

  return `${AUTHORIZE_URL}?${params.toString()}`;
}

function toStoredTokens(
  payload: SpotifyTokenResponse,
  previousRefreshToken: string,
): StoredSpotifyTokens {
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? previousRefreshToken,
    expiresAt: Date.now() + payload.expires_in * 1000,
    scope: payload.scope ?? SCOPES,
  };
}

async function postToken(body: URLSearchParams) {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) return null;

  return (await response.json()) as SpotifyTokenResponse;
}

export async function exchangeCodeForTokens(code: string, verifier: string) {
  const clientId = getClientId();

  if (clientId === null) return null;

  const payload = await postToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getRedirectUri(),
      client_id: clientId,
      code_verifier: verifier,
    }),
  );

  if (payload === null) return null;

  const tokens = toStoredTokens(payload, "");

  if (tokens.refreshToken.length === 0) return null;

  writeTokens(tokens);

  return tokens;
}

let pendingRefresh: Promise<StoredSpotifyTokens | null> | null = null;

export function refreshTokens(): Promise<StoredSpotifyTokens | null> {
  pendingRefresh ??= (async () => {
    try {
      const clientId = getClientId();
      const current = readTokens();

      if (clientId === null || current === null) return null;

      const payload = await postToken(
        new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: current.refreshToken,
          client_id: clientId,
        }),
      );

      if (payload === null) return null;

      const tokens = toStoredTokens(payload, current.refreshToken);

      writeTokens(tokens);

      return tokens;
    } catch {
      return null;
    } finally {
      pendingRefresh = null;
    }
  })();

  return pendingRefresh;
}
