import { ALL_SOUNDS } from "@/utils/feedbackCatalog";
import { vibrate } from "@/utils/haptics";
import {
  DEFAULT_PREFERENCES,
  readPreferences,
  writePreferences,
  type Preferences,
} from "@/utils/preferencesStorage";
import { setSpeechDriver } from "@/utils/speech";
import { webSpeechDriver } from "@/utils/speechDrivers/webSpeech";
import { prefetchSounds, resumeAudio, unlockAudio } from "@/utils/sound";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface PreferencesContextValue {
  preferences: Preferences;
  // Genérico, e não `value: boolean`: a velocidade da leitura em voz alta é
  // numérica, e amarrar o setter a booleano obrigaria a um segundo setter.
  setPreference: <K extends keyof Preferences>(
    key: K,
    value: Preferences[K],
  ) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

/**
 * Tudo que responde a toque no app. Cobre os `Button` do HeroUI, os `<button>`
 * nativos, os `NavLink` da navegação inferior e os itens de papel `button` do
 * react-aria — nenhum deles compartilha um componente comum onde interceptar.
 *
 * `label` fica de fora de propósito: clicar num rótulo sintetiza um clique no
 * input associado, e os dois borbulham no mesmo gesto.
 */
const PRESSABLE_SELECTOR =
  'button, a[href], [role="button"], [role="tab"], [role="switch"], [role="option"], [role="radio"]';

const DISABLED_SELECTOR = ':disabled, [aria-disabled="true"], [data-disabled]';

export function PreferencesProvider({ children }: { children: ReactNode }) {
  // Começa nos defaults para o HTML do servidor bater com o do cliente; o valor
  // guardado entra na hidratação.
  const [stored, setStored] = useState<Preferences | null>(null);
  const preferences = stored ?? DEFAULT_PREFERENCES;

  // Registra o motor de fala do navegador. É o único lugar que conhece a
  // implementação — trocar por uma API na nuvem é mudar esta linha.
  useEffect(() => {
    setSpeechDriver(webSpeechDriver);
  }, []);

  useEffect(() => {
    const initial = readPreferences();

    setStored(initial);
    // Grava de imediato: `readPreferences` pode ter herdado a preferência
    // antiga do Pomodoro, e o próximo write da sessão apagaria a origem.
    writePreferences(initial);
  }, []);

  function setPreference<K extends keyof Preferences>(
    key: K,
    value: Preferences[K],
  ) {
    const next = { ...preferences, [key]: value };

    setStored(next);
    writePreferences(next);
  }

  const { hapticsEnabled, soundEnabled } = preferences;

  useEffect(() => {
    // `click`, e não `pointerdown`: só o clique significa que houve uma ação de
    // verdade. Toque em `pointerdown` também dispara ao começar um scroll, ao
    // arrastar e no long-press abortado — e, pela spec, um `pointerdown` de
    // dedo nem concede ativação de usuário, então nem vibração nem áudio
    // seriam liberados por ele.
    function handleClick(event: MouseEvent) {
      // Só cria o AudioContext se o som estiver ligado — o do desligado não
      // precisa de um contexto suspenso pendurado no documento.
      if (soundEnabled) unlockAudio();

      if (!hapticsEnabled) return;
      if (!(event.target instanceof Element)) return;

      const pressable = event.target.closest(PRESSABLE_SELECTOR);
      if (pressable === null || pressable.matches(DISABLED_SELECTOR)) return;

      vibrate("tap");
    }

    // Fase de captura em `window`: o `usePress` do react-aria chama
    // `stopPropagation`, e depender da ordem de borbulhamento seria frágil.
    window.addEventListener("click", handleClick, true);

    return () => window.removeEventListener("click", handleClick, true);
  }, [hapticsEnabled, soundEnabled]);

  useEffect(() => {
    if (!soundEnabled) return;

    // No iOS o contexto entra em `interrupted` com ligação ou Siri e não volta
    // sozinho; sem isto o som some pelo resto da visita.
    function handleVisibility() {
      if (!document.hidden) resumeAudio();
    }

    document.addEventListener("visibilitychange", handleVisibility);

    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [soundEnabled]);

  useEffect(() => {
    if (!soundEnabled) return;

    // Depois do primeiro clique: a essa altura a página já pintou e o kit não
    // disputa banda com as requisições de rota.
    function warm() {
      prefetchSounds(ALL_SOUNDS);
    }

    window.addEventListener("click", warm, { once: true });

    return () => window.removeEventListener("click", warm);
  }, [soundEnabled]);

  return (
    <PreferencesContext.Provider value={{ preferences, setPreference }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);

  if (context === null) {
    throw new Error("usePreferences precisa de um PreferencesProvider acima.");
  }

  return context;
}
