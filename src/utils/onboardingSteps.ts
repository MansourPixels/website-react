/**
 * As etapas do onboarding, em ordem. O slug vai para a URL (`?passo=`), que é
 * o que faz a etapa sobreviver ao redirect de página inteira do Spotify.
 */
export const ONBOARDING_STEPS = [
  "boas-vindas",
  "avatar",
  "conexoes",
  "funcionalidades",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** O nome curto que aparece ao lado de "Passo 2 de 4". */
export const ONBOARDING_STEP_LABELS: Record<OnboardingStep, string> = {
  "boas-vindas": "Boas-vindas",
  avatar: "Seu avatar",
  conexoes: "Conexões",
  funcionalidades: "O que dá para fazer",
};

export const STEP_PARAM = "passo";

/**
 * Slug desconhecido cai na primeira etapa, pela mesma razão de
 * `resolveNextRoute`: o valor vem da URL, e a URL é digitável.
 */
export function resolveStep(value: string | null): OnboardingStep {
  const found = ONBOARDING_STEPS.find((step) => step === value);

  return found ?? ONBOARDING_STEPS[0];
}

export function stepPosition(step: OnboardingStep) {
  return ONBOARDING_STEPS.indexOf(step) + 1;
}

/** `null` na última etapa — quem chama trata isso como "concluir". */
export function nextStep(step: OnboardingStep): OnboardingStep | null {
  return ONBOARDING_STEPS[stepPosition(step)] ?? null;
}
