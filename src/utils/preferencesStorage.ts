export interface Preferences {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  soundEnabled: true,
  hapticsEnabled: true,
};

const PREFERENCES_KEY = "revi:preferencias";

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
    // Armazenamento cheio ou bloqueado: a preferência vale só nesta sessão.
  }
}

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

export function sanitizePreferences(value: unknown): Preferences {
  const raw = (value ?? {}) as Partial<Preferences>;

  return {
    soundEnabled: readBoolean(
      raw.soundEnabled,
      DEFAULT_PREFERENCES.soundEnabled,
    ),
    hapticsEnabled: readBoolean(
      raw.hapticsEnabled,
      DEFAULT_PREFERENCES.hapticsEnabled,
    ),
  };
}

/** Chave do Pomodoro, que abrigava a única preferência de som que existia. */
const LEGACY_SESSION_KEY = "revi:sessao-estudos";

export function readPreferences(): Preferences {
  const stored = readJson<Partial<Preferences>>(PREFERENCES_KEY);

  if (stored !== null) return sanitizePreferences(stored);

  // Quem já tinha desligado "Tocar um som ao terminar a fase" não pode ganhar
  // som em vinte lugares novos por causa da migração: um opt-out não vira
  // opt-in. A leitura é única, e o provider grava o resultado na hidratação —
  // `writeStudySession` reescreve o objeto inteiro e apagaria a chave antiga.
  const legacy = readJson<{ settings?: { soundEnabled?: unknown } }>(
    LEGACY_SESSION_KEY,
  );
  const legacySound = legacy?.settings?.soundEnabled;

  return sanitizePreferences(
    typeof legacySound === "boolean" ? { soundEnabled: legacySound } : null,
  );
}

export function writePreferences(preferences: Preferences) {
  writeJson(PREFERENCES_KEY, preferences);
}
