export type SpotifyStatus =
  | "loading"
  | "disconnected"
  | "connecting"
  | "connected";

export type SpotifyIssue =
  | "disconnected"
  | "noDevice"
  | "notPremium"
  | "rateLimited"
  | "requestFailed"
  | null;

export interface SpotifyProfile {
  displayName: string;
  isPremium: boolean;
  imageUrl: string | null;
}

export interface SpotifyNowPlaying {
  trackName: string;
  artistName: string;
  albumImageUrl: string | null;
  deviceName: string | null;
  isPlaying: boolean;
}

export type SpotifyCommandResult =
  | { ok: true }
  | { ok: false; issue: Exclude<SpotifyIssue, null>; retryAfter?: number };

export interface StoredSpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
}

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface SpotifyMeResponse {
  display_name: string | null;
  product?: string;
  images?: { url: string }[];
}

export interface SpotifyPlayerResponse {
  is_playing: boolean;
  device?: { name: string } | null;
  item?: {
    name: string;
    artists?: { name: string }[];
    album?: { images?: { url: string }[] };
  } | null;
}
