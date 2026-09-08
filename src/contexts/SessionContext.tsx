import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

import { useStudySession, type StudySession } from "@/hooks/useStudySession";
import { useSpotify } from "./SpotifyContext";

type DesiredPlayback = "play" | "pause" | "ignore";

const SessionContext = createContext<StudySession | null>(null);

/**
 * A sessão vive acima das rotas: o cronômetro precisa continuar contando — e
 * continuar mandando no Spotify — enquanto o aluno anda pelas pastas. É esta
 * mesma instância que a tela `/sessao` e a ilha flutuante consomem, para que
 * nunca existam dois cronômetros disputando o mesmo `localStorage`.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const session = useStudySession();
  const spotify = useSpotify();

  const { phase, status, settings } = session;
  const { play, pause, watchPlayback, status: spotifyStatus } = spotify;

  const isActive = status !== "idle";

  const desired: DesiredPlayback =
    !settings.controlsSpotify || spotifyStatus !== "connected"
      ? "ignore"
      : phase === "focus" && status === "running"
        ? "play"
        : "pause";

  const lastDesired = useRef<DesiredPlayback | null>(null);

  useEffect(() => {
    if (desired === "ignore") return;

    if (lastDesired.current === null) {
      lastDesired.current = desired;

      return;
    }

    if (lastDesired.current === desired) return;

    lastDesired.current = desired;

    void (desired === "play" ? play() : pause());
  }, [desired, play, pause]);

  // Consultar o que está tocando só faz sentido quando existe onde mostrar
  // isso: a ilha aparece com a sessão em andamento. A tela `/sessao` pede o
  // seu próprio watcher, que soma ao contador do provider do Spotify.
  useEffect(() => {
    if (!isActive || spotifyStatus !== "connected") return;

    return watchPlayback();
  }, [isActive, spotifyStatus, watchPlayback]);

  return (
    <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);

  if (context === null) {
    throw new Error("useSession precisa estar dentro de SessionProvider");
  }

  return context;
}
