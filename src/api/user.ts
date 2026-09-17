import { apiFetch } from "@/api/client";

export interface WhoamiResponse {
  ownerId: string;
  avatarUrl: string;
  /** `null` até o aluno concluir o onboarding; ISO 8601 depois disso. */
  onboardingCompletedAt: string | null;
}

export function getWhoami(): Promise<WhoamiResponse> {
  return apiFetch<WhoamiResponse>("/api/whoami");
}

export function updateAvatar(avatarUrl: string): Promise<void> {
  return apiFetch<void>("/api/whoami", { method: "PATCH", body: { avatarUrl } });
}
