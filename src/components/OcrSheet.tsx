import { Button, Spinner, cn } from "@heroui/react";
import { ChevronDown, ChevronUp, ScanText, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { ApiError } from "@/api/client";
import { getContentText } from "@/api/content";
import type { ContentText } from "@/types/api/content";
import { getContentTextStatus } from "@/utils/contentTextStatus";

import { SpeakButton } from "./SpeakButton";

interface OcrSheetProps {
  contentId: string;
}

const POLL_INTERVAL_MS = 3_000;
const POLL_MAX_DURATION_MS = 60_000;

/**
 * O texto extraído do material, num painel na borda de baixo do
 * visualizador.
 *
 * Nasce espiando, não escondido: para quem não lê, o botão de ouvir precisa
 * estar visível sem depender de descobrir um gesto.
 */
export function OcrSheet({ contentId }: OcrSheetProps) {
  const [content, setContent] = useState<ContentText | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const startedAt = Date.now();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    let isStopped = false;

    setContent(undefined);
    setLoadError(null);
    setIsExpanded(false);

    const loadContentText = () => {
      controller = new AbortController();

      getContentText(contentId, controller.signal)
        .then((nextContent) => {
          if (isStopped) return;

          setContent(nextContent);

          const elapsed = Date.now() - startedAt;
          if (
            nextContent.extractedAt === null &&
            elapsed + POLL_INTERVAL_MS <= POLL_MAX_DURATION_MS
          ) {
            timeoutId = setTimeout(loadContentText, POLL_INTERVAL_MS);
          }
        })
        .catch((error: unknown) => {
          if (isStopped || controller?.signal.aborted) return;

          setLoadError(
            error instanceof ApiError
              ? error.detail
              : "Não foi possível ler o texto deste material.",
          );
        });
    };

    loadContentText();

    return () => {
      isStopped = true;
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      controller?.abort();
    };
  }, [contentId]);

  const text = content?.text.trim() ?? "";
  const contentStatus = content === undefined ? null : getContentTextStatus(content);
  const hasText = contentStatus === "available";

  return (
    <section
      aria-label="Texto extraído do material"
      className={cn(
        "sheet-in bg-surface pointer-events-auto absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 rounded-t-3xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-surface",
        isExpanded ? "max-h-[70svh]" : "max-h-48",
      )}
    >
      {/* Alça: sinaliza que o painel abre, e é o alvo de toque grande. */}
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-label={
          isExpanded ? "Recolher o texto extraído" : "Expandir o texto extraído"
        }
        className="-mt-1 flex w-full shrink-0 justify-center py-1"
        onClick={() => setIsExpanded((previous) => !previous)}
      >
        <span className="bg-separator h-1 w-9 rounded-full" />
      </button>

      <header className="flex shrink-0 items-center gap-3">
        <span
          aria-hidden="true"
          className="bg-accent-soft text-accent flex size-9 shrink-0 items-center justify-center rounded-xl"
        >
          <ScanText className="size-5" />
        </span>

        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="font-semibold">Texto extraído</h2>
          <p className="text-muted text-xs">
            {hasText
              ? "Extraído do material pelo Revi IA."
              : "Leitura de texto do material pelo Revi IA."}
          </p>
        </div>

        {hasText ? (
          <SpeakButton label="o texto extraído deste material" text={text} />
        ) : null}

        <Button
          isIconOnly
          variant="ghost"
          size="lg"
          aria-label={
            isExpanded ? "Recolher o texto extraído" : "Expandir o texto extraído"
          }
          onPress={() => setIsExpanded((previous) => !previous)}
        >
          {isExpanded ? (
            <ChevronDown className="size-5" />
          ) : (
            <ChevronUp className="size-5" />
          )}
        </Button>
      </header>

      {loadError !== null ? (
        <p role="alert" className="text-danger shrink-0 text-sm text-pretty">
          {loadError}
        </p>
      ) : content === undefined ? (
        <div className="flex shrink-0 items-center gap-2 py-1" aria-busy="true">
          <Spinner size="sm" />
          <span className="text-muted text-sm">Lendo o texto do material…</span>
        </div>
      ) : contentStatus === "pending" ? (
        <p className="text-muted flex shrink-0 items-center gap-2 text-sm text-pretty">
          <Sparkles className="size-4 shrink-0" aria-hidden="true" />
          O Revi IA ainda está processando este material.
        </p>
      ) : contentStatus === "empty" ? (
        <p className="text-muted shrink-0 text-sm text-pretty">
          Nenhum texto legível foi encontrado neste material.
        </p>
      ) : (
        <div
          className={cn(
            "min-h-0 text-sm leading-relaxed text-pretty whitespace-pre-line",
            isExpanded
              ? "flex-1 overflow-y-auto overscroll-contain"
              : "line-clamp-2 overflow-hidden",
          )}
        >
          {text}
        </div>
      )}
    </section>
  );
}
