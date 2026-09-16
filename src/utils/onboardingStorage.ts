/**
 * Estado do onboarding por usuário.
 *
 * Diferente de `achievementsStorage.ts`, que é global, aqui a chave é o
 * `ownerId`: num aparelho compartilhado — o laboratório da escola é o caso real
 * — a conclusão de um aluno não pode esconder o onboarding do próximo.
 */
export interface OnboardingState {
  /** ISO 8601, ou `null` enquanto o aluno não terminou. */
  completedAt: string | null;
}

const ONBOARDING_KEY = "revi:onboarding";

const EMPTY: OnboardingState = { completedAt: null };

type OnboardingByOwner = Record<string, OnboardingState>;

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);

    if (raw === null) return null;

    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Armazenamento cheio ou bloqueado: o onboarding se repete no próximo
    // acesso. Repetir é chato, mas é melhor do que quebrar a tela.
  }
}

export function sanitizeOnboardingState(value: unknown): OnboardingState {
  const raw = (value ?? {}) as Partial<OnboardingState>;

  return {
    completedAt:
      typeof raw.completedAt === "string" && raw.completedAt.length > 0
        ? raw.completedAt
        : EMPTY.completedAt,
  };
}

/**
 * Cada `ownerId` é saneado isoladamente: uma entrada corrompida não pode
 * derrubar a dos outros usuários do mesmo aparelho.
 */
export function sanitizeOnboardingByOwner(value: unknown): OnboardingByOwner {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const entries = Object.entries(value as Record<string, unknown>);

  return Object.fromEntries(
    entries.map(([ownerId, state]) => [
      ownerId,
      sanitizeOnboardingState(state),
    ]),
  );
}

export function readOnboarding(ownerId: string): OnboardingState {
  const byOwner = sanitizeOnboardingByOwner(readJson<unknown>(ONBOARDING_KEY));

  return byOwner[ownerId] ?? EMPTY;
}

export function writeOnboarding(ownerId: string, state: OnboardingState) {
  const byOwner = sanitizeOnboardingByOwner(readJson<unknown>(ONBOARDING_KEY));

  byOwner[ownerId] = sanitizeOnboardingState(state);

  writeJson(ONBOARDING_KEY, byOwner);
}
