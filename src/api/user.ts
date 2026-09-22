import { apiFetch } from "@/api/client";

export interface WhoamiResponse {
  ownerId: string;
  avatarUrl: string;
  /** `null` até o aluno concluir o onboarding; ISO 8601 depois disso. */
  onboardingCompletedAt: string | null;
  /**
   * Se a conta tem o papel de realm `admin`. Opcional porque um backend
   * anterior à API de administração não manda o campo: ausente vale `false`,
   * para a ordem de deploy entre front e back não importar.
   */
  admin?: boolean;
}

export function isAdmin(whoami: Pick<WhoamiResponse, "admin">): boolean {
  return whoami.admin ?? false;
}

export function getWhoami(): Promise<WhoamiResponse> {
  return apiFetch<WhoamiResponse>("/api/whoami");
}

export function updateAvatar(avatarUrl: string): Promise<void> {
  return apiFetch<void>("/api/whoami", { method: "PATCH", body: { avatarUrl } });
}
