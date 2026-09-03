import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  applyResolvedTheme,
  DEFAULT_THEME_PREFERENCE,
  readThemePreference,
  resolveTheme,
  writeThemePreference,
  type ThemePreference,
} from "@/utils/themeStorage";

interface ThemeContextValue {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Começa em "system" para o HTML do servidor bater com o do cliente; o valor
  // guardado entra na hidratação. O tema já visível na tela não depende disto —
  // o script inline em `themeInitScript.ts` já aplicou o atributo em `<html>`
  // antes do primeiro paint. Este estado é só para a UI de Preferências saber
  // qual opção mostrar marcada.
  const [preference, setStored] = useState<ThemePreference>(
    DEFAULT_THEME_PREFERENCE,
  );

  useEffect(() => {
    const initial = readThemePreference();

    setStored(initial);
    // Reaplica de forma defensiva: idempotente se o script inline já acertou,
    // e um resguardo caso ele tenha falhado silenciosamente (ex.: localStorage
    // bloqueado por configuração de privacidade).
    applyResolvedTheme(resolveTheme(initial));
  }, []);

  // Só entra em cena com "Sistema" selecionado: acompanha o aparelho mudando de
  // tema sozinho (ex.: ao anoitecer) enquanto o app segue aberto.
  useEffect(() => {
    if (preference !== "system") return;
    if (typeof window === "undefined" || !window.matchMedia) return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    function handleChange() {
      applyResolvedTheme(resolveTheme("system"));
    }

    media.addEventListener("change", handleChange);

    return () => media.removeEventListener("change", handleChange);
  }, [preference]);

  function setPreference(next: ThemePreference) {
    setStored(next);
    writeThemePreference(next);
    applyResolvedTheme(resolveTheme(next));
  }

  return (
    <ThemeContext.Provider value={{ preference, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === null) {
    throw new Error("useTheme precisa de um ThemeProvider acima.");
  }

  return context;
}
