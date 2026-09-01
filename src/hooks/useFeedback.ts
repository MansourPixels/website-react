import { usePreferences } from "@/contexts/PreferencesContext";
import { FEEDBACK, type FeedbackEvent } from "@/utils/feedbackCatalog";
import { vibrate } from "@/utils/haptics";
import { playSound } from "@/utils/sound";
import { useCallback, useEffect, useRef } from "react";

/**
 * Ponto único de disparo de retorno tátil e sonoro. A vibração de toque comum
 * é global (ver `PreferencesProvider`); o que passa por aqui são os marcos e as
 * interações-assinatura, que têm som próprio.
 */
export function useFeedback() {
  const { preferences } = usePreferences();

  // A função precisa ser referencialmente estável para sempre: ela entra nas
  // dependências de effects (a revelação escalonada do simulado, entre outros)
  // e trocar de identidade ao mexer num toggle os reiniciaria.
  const preferencesRef = useRef(preferences);

  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  return useCallback((event: FeedbackEvent) => {
    const { soundEnabled, hapticsEnabled } = preferencesRef.current;
    const { sound, haptic } = FEEDBACK[event];

    if (hapticsEnabled && haptic !== undefined) vibrate(haptic);
    if (soundEnabled && sound !== undefined) playSound(sound);
  }, []);
}
