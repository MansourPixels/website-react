export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const DEFAULT_THEME_PREFERENCE: ThemePreference = "system";

const THEME_KEY = "revi:tema";

// Aproximações do `--background` claro e escuro para o status bar do PWA — não
// existe um token formal de marca para o escuro ainda (ver DESIGN.md).
export const THEME_COLOR_LIGHT = "#f4f4f5";
export const THEME_COLOR_DARK = "#141416";

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

function sanitizeThemePreference(value: unknown): ThemePreference {
  return value === "light" || value === "dark" || value === "system"
    ? value
    : DEFAULT_THEME_PREFERENCE;
}

export function readThemePreference(): ThemePreference {
  return sanitizeThemePreference(readJson<unknown>(THEME_KEY));
}

export function writeThemePreference(preference: ThemePreference) {
  writeJson(THEME_KEY, preference);
}

/** "system" vira uma escolha real via `matchMedia`; as outras duas passam direto. */
export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference !== "system") return preference;

  if (typeof window === "undefined" || !window.matchMedia) return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Aplica o tema já resolvido ao `<html>` e ao `theme-color` do PWA. Usada tanto
 * pelo `ThemeProvider` (mudanças depois de montado) quanto — numa cópia inline,
 * que não pode importar módulo nenhum — pelo script anti-flash em
 * `themeInitScript.ts`. Mudar a chave, os valores ou as cores aqui exige mudar
 * lá também.
 */
export function applyResolvedTheme(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;

  document.documentElement.dataset.theme = resolved;

  const meta = document.querySelector('meta[name="theme-color"]');

  meta?.setAttribute(
    "content",
    resolved === "dark" ? THEME_COLOR_DARK : THEME_COLOR_LIGHT,
  );
}
