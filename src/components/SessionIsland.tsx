import { cn } from "@heroui/react";
import { Coffee, Music, Pause, Play, Timer } from "lucide-react";
import { Link } from "react-router";

import { useSession } from "@/contexts/SessionContext";
import { useSpotify } from "@/contexts/SpotifyContext";
import { formatCountdown, phaseLabels } from "@/hooks/useStudySession";

// Circunferência do anel de progresso (2πr, com r = 15.5 no viewBox de 36).
const RING_LENGTH = 97.389;

interface SessionIslandProps {
  /**
   * `top` imita a Dynamic Island: pílula flutuando logo abaixo da safe area,
   * só no mobile. `dock` acompanha a barra inferior, só no desktop.
   */
  placement: "top" | "dock";
}

export function SessionIsland({ placement }: SessionIslandProps) {
  const session = useSession();
  const spotify = useSpotify();

  const isFocus = session.phase === "focus";
  const isRunning = session.status === "running";

  const PhaseIcon = isFocus ? Timer : Coffee;

  const progress =
    session.totalMs > 0
      ? Math.min(1, (session.totalMs - session.remainingMs) / session.totalMs)
      : 0;

  const track =
    spotify.status === "connected" ? spotify.nowPlaying : null;

  const isTop = placement === "top";

  return (
    <div
      className={cn(
        "pointer-events-none flex justify-center",
        isTop
          ? "fixed inset-x-0 top-0 z-40 px-3 pt-[max(0.5rem,env(safe-area-inset-top))] md:hidden"
          : "hidden md:flex",
      )}
    >
      <div
        className={cn(
          "pointer-events-auto flex items-center gap-1 rounded-full bg-zinc-900 md:bg-white md:text-zinc-900 p-1.5 text-white md:shadow-none md:border shadow-lg shadow-black/25 md:h-16",
          isTop
            ? "island-in-top w-full max-w-xs"
            : "island-in-bottom w-60 lg:w-80",
        )}
      >
        <Link
          to="/sessao"
          className="flex min-w-0 flex-1 items-center gap-2 rounded-full pl-0.5 outline-offset-2 focus-visible:outline-2 focus-visible:outline-white"
        >
          <span className="relative grid size-9 shrink-0 place-items-center">
            <svg viewBox="0 0 36 36" className="size-9 -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                strokeWidth="2.5"
                className="stroke-white/20 md:stroke-black/20"
              />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={`${progress * RING_LENGTH} ${RING_LENGTH}`}
                className={cn(
                  "transition-[stroke-dasharray] duration-300 ease-linear motion-reduce:transition-none",
                  isFocus ? "stroke-white md:stroke-black" : "stroke-white/60 md:stroke-black/60",
                )}
              />
            </svg>
            <PhaseIcon className="absolute size-4" />
          </span>

          <span className="flex min-w-0 flex-col text-left leading-tight">
            <span className="text-sm font-semibold tabular-nums">
              {formatCountdown(session.remainingMs)}
            </span>
            <span className="truncate text-xs text-white/60 md:text-black/60">
              {isRunning ? phaseLabels[session.phase] : "Pausado"}
            </span>
          </span>

          {track !== null ? (
            <span className="ml-1 flex min-w-0 items-center gap-1.5 border-l border-white/15 pl-2">
              {track.albumImageUrl != null ? (
                <img
                  src={track.albumImageUrl}
                  alt=""
                  className="size-7 shrink-0 rounded-md object-cover"
                />
              ) : (
                <Music className="size-4 shrink-0 text-white/60 md:text-black/60" />
              )}
              <span className="truncate text-xs text-white/70 md:text-black/70">
                {track.trackName}
              </span>
            </span>
          ) : null}

          <span className="sr-only">Abrir a sessão de estudos</span>
        </Link>

        <button
          type="button"
          onClick={session.toggle}
          aria-label={isRunning ? "Pausar a sessão" : "Retomar a sessão"}
          className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 outline-offset-2 transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
        >
          {isRunning ? (
            <Pause className="size-4 fill-current" />
          ) : (
            <Play className="size-4 fill-current" />
          )}
        </button>
      </div>
    </div>
  );
}
