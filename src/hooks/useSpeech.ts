import { usePreferences } from "@/contexts/PreferencesContext";
import {
  cancelSpeech,
  isSpeechSupported,
  speak as speakText,
  type SpeechStatus,
} from "@/utils/speech";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Ponte entre as telas e o motor de fala.
 *
 * Cada instância controla a própria leitura: `toggle` para se estiver falando e
 * começa se não. A fala é cancelada no unmount — numa SPA, sair da tela
 * deixaria o narrador lendo o conteúdo anterior.
 */
export function useSpeech() {
  const { preferences } = usePreferences();

  const [status, setStatus] = useState<SpeechStatus>("idle");

  // `isSpeechSupported` depende de `window`; checar só depois de montar evita
  // divergência entre o HTML do servidor e o primeiro render.
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(isSpeechSupported());
  }, []);

  // A velocidade entra por referência para `speak` e `stop` nunca trocarem de
  // identidade: elas entram em dependências de effect (a auto-leitura), e
  // mexer no controle de velocidade reiniciaria a leitura.
  const rateRef = useRef(preferences.speechRate);

  useEffect(() => {
    rateRef.current = preferences.speechRate;
  }, [preferences.speechRate]);

  // Só o componente que iniciou a fala pode mexer no status; sem isto, uma
  // segunda instância cancelando deixaria a primeira presa em "speaking".
  const isOwnerRef = useRef(false);

  const stop = useCallback(() => {
    if (!isOwnerRef.current) return;

    cancelSpeech();
    isOwnerRef.current = false;
    setStatus("idle");
  }, []);

  const speak = useCallback((text: string) => {
    if (text.trim().length === 0) return;

    isOwnerRef.current = true;

    speakText(text, {
      rate: rateRef.current,
      onStatusChange: (next) => {
        if (!isOwnerRef.current) return;

        setStatus(next);
        if (next === "idle") isOwnerRef.current = false;
      },
    });
  }, []);

  const isSpeaking = status === "speaking";

  const toggle = useCallback(
    (text: string) => {
      if (isSpeaking) {
        stop();
        return;
      }

      speak(text);
    },
    [isSpeaking, speak, stop],
  );

  useEffect(() => stop, [stop]);

  return {
    isSupported,
    isSpeaking,
    status,
    speak,
    stop,
    toggle,
    /** Preferência de leitura automática, para a tela decidir se antecipa. */
    autoPlay: preferences.speechAutoPlay,
  };
}
