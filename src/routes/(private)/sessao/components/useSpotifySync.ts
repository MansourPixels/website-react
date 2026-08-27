import { useEffect, useRef } from "react";

import { useSpotify } from "@/contexts/SpotifyContext";
import type { SessionPhase, SessionStatus } from "@/types/StudySession";

type DesiredPlayback = "play" | "pause" | "ignore";

interface UseSpotifySyncOptions {
  phase: SessionPhase;
  status: SessionStatus;
  controlsSpotify: boolean;
}

/**
 * A música toca durante o foco e para durante a pausa. O silêncio é o sinal de
 * que a fase virou — é o motivo de a integração existir.
 */
export function useSpotifySync({
  phase,
  status,
  controlsSpotify,
}: UseSpotifySyncOptions) {
  const spotify = useSpotify();

  const desired: DesiredPlayback =
    !controlsSpotify || spotify.status !== "connected"
      ? "ignore"
      : phase === "focus" && status === "running"
        ? "play"
        : "pause";

  const lastDesired = useRef<DesiredPlayback | null>(null);

  // As dependências são as funções estáveis do contexto, nunca o objeto
  // inteiro: ele muda a cada atualização da faixa em exibição, e isso religaria
  // os efeitos quatro vezes por minuto.
  const { play, pause, watchPlayback } = spotify;

  useEffect(() => {
    if (desired === "ignore") return;

    // A primeira passagem apenas semeia o valor: recarregar a página no meio de
    // um foco não deve reemitir um play que já está valendo.
    if (lastDesired.current === null) {
      lastDesired.current = desired;

      return;
    }

    if (lastDesired.current === desired) return;

    lastDesired.current = desired;

    // Nunca lança, por contrato do contexto: uma falha do Spotify não pode
    // derrubar o cronômetro.
    void (desired === "play" ? play() : pause());
  }, [desired, play, pause]);

  // Mantém o polling da faixa em exibição ligado só enquanto esta tela vive.
  useEffect(() => watchPlayback(), [watchPlayback]);

  return spotify;
}
