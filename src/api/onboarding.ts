import {
  readOnboarding,
  writeOnboarding,
  type OnboardingState,
} from "@/utils/onboardingStorage";

/**
 * O seam de persistência do onboarding.
 *
 * Hoje é `localStorage`. Quando `/api/whoami/onboarding` existir no `revi-back`,
 * só este arquivo muda — cada corpo vira um `apiFetch` com o caminho documentado
 * em GOOGLE.md, e as assinaturas já estão nesse formato. Nenhuma tela é tocada.
 *
 * As funções já devolvem `Promise` mesmo com `localStorage` sendo síncrono: é
 * exatamente isso que permite a troca sem reescrever quem chama.
 */

export function getOnboardingState(ownerId: string): Promise<OnboardingState> {
  return Promise.resolve(readOnboarding(ownerId));
}

export function completeOnboarding(ownerId: string): Promise<void> {
  // Idempotente, como o endpoint terá de ser: reconcluir não reescreve a data,
  // senão voltar ao onboarding pelo histórico do navegador moveria o marco.
  const current = readOnboarding(ownerId);

  if (current.completedAt === null) {
    writeOnboarding(ownerId, { completedAt: new Date().toISOString() });
  }

  return Promise.resolve();
}
