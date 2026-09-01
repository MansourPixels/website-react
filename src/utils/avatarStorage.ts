const AVATAR_KEY = "revi:avatar";

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
    // Armazenamento cheio ou bloqueado: o avatar vale só nesta sessão.
  }
}

/**
 * Guarda a URL montada, e não a configuração: é exatamente o que o backend vai
 * armazenar, então não existem duas formas do mesmo dado para sincronizar.
 */
export function readAvatarUrl(): string | null {
  const stored = readJson<unknown>(AVATAR_KEY);

  return typeof stored === "string" && stored.length > 0 ? stored : null;
}

export function writeAvatarUrl(url: string) {
  writeJson(AVATAR_KEY, url);
}
