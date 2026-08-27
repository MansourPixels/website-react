import { useEffect, useRef } from "react";

import { useSpotify } from "@/contexts/SpotifyContext";
import type { SessionPhase, SessionStatus } from "@/types/StudySession";

type DesiredPlayback = "play" | "pause" | "ignore";

interface UseSpotifySyncOptions {
  phase: SessionPhase;
  status: SessionStatus;
  controlsSpotify: boolean;
}

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

  const { play, pause, watchPlayback } = spotify;

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

  useEffect(() => watchPlayback(), [watchPlayback]);

  return spotify;
}
