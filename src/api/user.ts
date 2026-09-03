import { apiFetch } from "@/api/client";

export interface WhoamiResponse {
  ownerId: string;
  avatarUrl: string;
}

export function getWhoami(): Promise<WhoamiResponse> {
  return apiFetch<WhoamiResponse>("/api/whoami");
}

export function updateAvatar(avatarUrl: string): Promise<void> {
  return apiFetch<void>("/api/whoami", { method: "PATCH", body: { avatarUrl } });
}
