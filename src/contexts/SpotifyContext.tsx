import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type {
  SpotifyCommandResult,
  SpotifyIssue,
  SpotifyNowPlaying,
  SpotifyProfile,
  SpotifyStatus,
} from "@/types/Spotify";
import {
  fetchNowPlaying,
  fetchProfile,
  pausePlayback,
  startPlayback,
} from "@/utils/spotifyApi";
import { buildAuthorizeUrl, getClientId } from "@/utils/spotifyAuth";
import { clearTokens, readTokens } from "@/utils/spotifyStorage";

const POLL_INTERVAL_MS = 15_000;

const POST_COMMAND_DELAY_MS = 800;

interface SpotifyContextValue {
  status: SpotifyStatus;
  profile: SpotifyProfile | null;
  nowPlaying: SpotifyNowPlaying | null;
  issue: SpotifyIssue;
  retryAfter: number | null;
  isConfigured: boolean;
  connect: (returnTo: string) => Promise<void>;
  completeConnection: () => Promise<boolean>;
  disconnect: () => void;
  play: () => Promise<SpotifyCommandResult>;
  pause: () => Promise<SpotifyCommandResult>;
  refreshNowPlaying: () => Promise<void>;
  watchPlayback: () => () => void;
}

const SpotifyContext = createContext<SpotifyContextValue | null>(null);

export function SpotifyProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SpotifyStatus>("loading");
  const [profile, setProfile] = useState<SpotifyProfile | null>(null);
  const [nowPlaying, setNowPlaying] = useState<SpotifyNowPlaying | null>(null);
  const [issue, setIssue] = useState<SpotifyIssue>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [watcherCount, setWatcherCount] = useState(0);

  const suspendedUntil = useRef(0);

  const isConfigured = getClientId() !== null;

  useEffect(() => {
    let isActive = true;

    async function restore() {
      if (readTokens() === null) {
        if (isActive) setStatus("disconnected");

        return;
      }

      const restored = await fetchProfile();

      if (!isActive) return;

      if (restored === null) {
        clearTokens();
        setStatus("disconnected");

        return;
      }

      setProfile(restored);
      setStatus("connected");
      setIssue(restored.isPremium ? null : "notPremium");
    }

    void restore();

    return () => {
      isActive = false;
    };
  }, []);

  const applyIssue = useCallback(
    (next: SpotifyIssue, seconds?: number) => {
      setIssue(next);

      if (next === "rateLimited" && seconds !== undefined) {
        setRetryAfter(seconds);
        suspendedUntil.current = Date.now() + seconds * 1000;
      } else {
        setRetryAfter(null);
      }

      if (next === "disconnected") {
        setStatus("disconnected");
        setProfile(null);
        setNowPlaying(null);
      }
    },
    [],
  );

  const refreshNowPlaying = useCallback(async () => {
    if (readTokens() === null) return;
    if (Date.now() < suspendedUntil.current) return;

    const result = await fetchNowPlaying();

    if (result.ok) {
      setNowPlaying(result.data);
      setIssue((current) =>
        current === "rateLimited" || current === "requestFailed" ? null : current,
      );
      setRetryAfter(null);

      return;
    }

    applyIssue(result.issue, result.retryAfter);
  }, [applyIssue]);

  useEffect(() => {
    if (status !== "connected" || watcherCount === 0) return;
    if (typeof document === "undefined") return;

    let intervalId: number | null = null;

    function stop() {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    }

    function startPolling() {
      if (intervalId !== null) return;

      void refreshNowPlaying();
      intervalId = window.setInterval(() => void refreshNowPlaying(), POLL_INTERVAL_MS);
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        startPolling();
      } else {
        stop();
      }
    }

    if (document.visibilityState === "visible") startPolling();

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [status, watcherCount, refreshNowPlaying]);

  const watchPlayback = useCallback(() => {
    setWatcherCount((current) => current + 1);

    return () => setWatcherCount((current) => Math.max(0, current - 1));
  }, []);

  const connect = useCallback(async (returnTo: string) => {
    if (getClientId() === null) return;

    setStatus("connecting");

    const url = await buildAuthorizeUrl(returnTo);

    if (url === null) {
      setStatus("disconnected");

      return;
    }

    window.location.assign(url);
  }, []);

  const completeConnection = useCallback(async () => {
    const connected = await fetchProfile();

    if (connected === null) {
      clearTokens();
      setStatus("disconnected");

      return false;
    }

    setProfile(connected);
    setStatus("connected");
    setIssue(connected.isPremium ? null : "notPremium");
    setRetryAfter(null);

    return true;
  }, []);

  const disconnect = useCallback(() => {
    clearTokens();
    setStatus("disconnected");
    setProfile(null);
    setNowPlaying(null);
    setIssue(null);
    setRetryAfter(null);
  }, []);

  const runCommand = useCallback(
    async (
      command: typeof startPlayback | typeof pausePlayback,
    ): Promise<SpotifyCommandResult> => {
      try {
        const result = await command();

        if (result.ok) {
          setIssue((current) => (current === "notPremium" ? current : null));
          setRetryAfter(null);
          window.setTimeout(() => void refreshNowPlaying(), POST_COMMAND_DELAY_MS);

          return { ok: true };
        }

        applyIssue(result.issue, result.retryAfter);

        return { ok: false, issue: result.issue, retryAfter: result.retryAfter };
      } catch {
        applyIssue("requestFailed");

        return { ok: false, issue: "requestFailed" };
      }
    },
    [applyIssue, refreshNowPlaying],
  );

  const play = useCallback(() => runCommand(startPlayback), [runCommand]);
  const pause = useCallback(() => runCommand(pausePlayback), [runCommand]);

  const value = useMemo(
    () => ({
      status,
      profile,
      nowPlaying,
      issue,
      retryAfter,
      isConfigured,
      connect,
      completeConnection,
      disconnect,
      play,
      pause,
      refreshNowPlaying,
      watchPlayback,
    }),
    [
      status,
      profile,
      nowPlaying,
      issue,
      retryAfter,
      isConfigured,
      connect,
      completeConnection,
      disconnect,
      play,
      pause,
      refreshNowPlaying,
      watchPlayback,
    ],
  );

  return (
    <SpotifyContext.Provider value={value}>{children}</SpotifyContext.Provider>
  );
}

export function useSpotify() {
  const context = useContext(SpotifyContext);

  if (context === null) {
    throw new Error("useSpotify precisa estar dentro de SpotifyProvider");
  }

  return context;
}
