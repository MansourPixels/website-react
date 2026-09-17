import { apiFetch } from "./client";
import { getWhoami } from "./user";

export interface OnboardingState {
  /** ISO 8601, ou `null` enquanto o aluno não terminou. */
  completedAt: string | null;
}

/**
 * O onboarding é um fato da conta, não do aparelho: quem se cadastra no celular
 * e entra pelo computador não revê o fluxo.
 *
 * Não existe endpoint de leitura próprio — a data vem junto do `GET /api/whoami`
 * que o perfil já consome, e é `null` até a conclusão.
 */
export function getOnboardingState(): Promise<OnboardingState> {
  return getWhoami().then(({ onboardingCompletedAt }) => ({
    completedAt: onboardingCompletedAt,
  }));
}

/**
 * `204`, sem corpo. É idempotente no servidor: reconcluir não move a data, então
 * voltar ao onboarding pelo histórico do navegador não desloca o marco.
 */
export function completeOnboarding(): Promise<void> {
  return apiFetch<void>("/api/whoami/onboarding", { method: "POST" });
}
