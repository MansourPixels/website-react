import { Play } from "lucide-react";
import type { ReactNode } from "react";

import { formatTimestamp } from "@/utils/mediaTime";
import { seekLabel } from "@/utils/mediaArtifacts";

interface SeekButtonProps {
  startSeconds: number | null | undefined;
  onSeek: (seconds: number) => void;
  /** No lugar do `m:ss`, por exemplo "Rever este momento". */
  children?: ReactNode;
}

/**
 * O atalho para um momento do áudio. Sem `startSeconds` não aparece: nem todo
 * item tem momento, e um botão que não leva a lugar nenhum só atrapalha.
 */
export function SeekButton({ startSeconds, onSeek, children }: SeekButtonProps) {
  const label = seekLabel(startSeconds);

  if (label === null || typeof startSeconds !== "number") return null;

  return (
    <button
      type="button"
      aria-label={label}
      className="bg-accent-soft text-accent hover:bg-accent/20 inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-medium"
      onClick={() => onSeek(startSeconds)}
    >
      <Play className="size-3.5" aria-hidden />
      {children ?? <span className="tabular-nums">{formatTimestamp(startSeconds)}</span>}
    </button>
  );
}
