import type {
  GoogleAuthorizeUrl,
  GoogleConnectionStatus,
  GoogleToken,
} from "@/types/api/google";

import { apiFetch } from "./client";

export function getGoogleConnectionStatus(): Promise<GoogleConnectionStatus> {
  return apiFetch("/api/google/status");
}

export function getGoogleAuthorizeUrl(
  returnTo: string,
  timeZone: string,
): Promise<GoogleAuthorizeUrl> {
  const query = new URLSearchParams({ returnTo, timeZone });

  return apiFetch(`/api/google/authorize-url?${query.toString()}`);
}

export function getGoogleToken(): Promise<GoogleToken> {
  return apiFetch("/api/google/token");
}

export function disconnectGoogle(): Promise<void> {
  return apiFetch("/api/google/connection", { method: "DELETE" });
}
