import { Button, Spinner, cn } from "@heroui/react";
import { ChevronDown, ChevronUp, ScanText, Sparkles } from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";

import { ApiError } from "@/api/client";
import { getContentText } from "@/api/content";
import { getClassroomContentProcessing, getClassroomContentText } from "@/api/classrooms";
import type { ContentText } from "@/types/api/content";
import type { ClassroomContentProcessing, ClassroomContentText } from "@/types/api/classroom";
import { getContentTextStatus } from "@/utils/contentTextStatus";
import { MEDIA_POLL_LIMIT_MS, nextPollDelay } from "@/utils/mediaStatus";

import { SpeakButton } from "./SpeakButton";

interface OcrSheetProps {
  contentId: string;
  classroomContent?: { classroomId: string; folderId: string; contentId: string };
  onContentUnavailable?: () => void;
  /**
   * Áudio: o "texto" é a transcrição, que leva minutos e não segundos, então o
   * painel acompanha por mais tempo (com intervalo crescente) e diz "transcrição".
   */
  isMedia?: boolean;
  /** Só muda os textos: "áudio" ou "vídeo". */
  mediaKind?: "audio" | "video";
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
export function OcrSheet({ contentId, classroomContent, onContentUnavailable, isMedia = false, mediaKind = "audio" }: OcrSheetProps) {
  const mediaWord = mediaKind === "video" ? "vídeo" : "áudio";
  const noun = isMedia ? "a transcrição" : "o texto extraído";
  const title = isMedia ? "Transcrição" : "Texto extraído";
  const [content, setContent] = useState<ContentText | ClassroomContentText | undefined>(undefined);
  const [processing, setProcessing] = useState<ClassroomContentProcessing | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const classroomId = classroomContent?.classroomId;
  const folderId = classroomContent?.folderId;
  const classroomContentId = classroomContent?.contentId;
  const reportUnavailable = useEffectEvent(() => onContentUnavailable?.());

  useEffect(() => {
    const startedAt = Date.now();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    let isStopped = false;
    let attempt = 0;
    const pollLimit = isMedia ? MEDIA_POLL_LIMIT_MS : POLL_MAX_DURATION_MS;

    setContent(undefined);
    setLoadError(null);
    setIsExpanded(false);

    const loadContentText = () => {
      controller = new AbortController();
      const loader = classroomId === undefined || folderId === undefined || classroomContentId === undefined
        ? getContentText(contentId, controller.signal)
        : Promise.all([
            getClassroomContentProcessing(classroomId, folderId, classroomContentId, controller.signal),
            getClassroomContentText(classroomId, folderId, classroomContentId, controller.signal),
          ]);

      loader.then((result) => {
          if (isStopped) return;
          const nextContent = Array.isArray(result) ? result[1] : result;
          if (Array.isArray(result)) setProcessing(result[0]);
          setContent(nextContent);
          const elapsed = Date.now() - startedAt;
          if (
            (Array.isArray(result) ? result[0].status === "pending" || result[0].status === "processing" : nextContent.extractedAt === null) &&
            elapsed + POLL_INTERVAL_MS <= pollLimit
          ) {
            timeoutId = setTimeout(loadContentText, isMedia ? nextPollDelay(attempt) : POLL_INTERVAL_MS);
            attempt += 1;
          }
        })
        .catch((error: unknown) => {
          if (isStopped || controller?.signal.aborted) return;
          if (error instanceof ApiError && error.status === 404 && classroomId !== undefined) {
            reportUnavailable();
            return;
          }

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
  }, [classroomContentId, classroomId, contentId, folderId, isMedia]);

  const text = content?.text?.trim() ?? "";
  const contentStatus =
    content === undefined
      ? null
      : classroomId !== undefined
        ? processing?.status === "failed"
          ? "failed"
          : processing?.status === "completed"
            ? text.length > 0
              ? "available"
              : "empty"
            : "pending"
        : getContentTextStatus(content as ContentText);
  const hasText = contentStatus === "available";

  return (
    <section
      aria-label={isMedia ? `Transcrição do ${mediaWord}` : "Texto extraído do material"}
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
          isExpanded ? `Recolher ${noun}` : `Expandir ${noun}`
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
          <h2 className="font-semibold">{title}</h2>
          <p className="text-muted text-xs">
            {hasText
              ? isMedia ? `Transcrita do ${mediaWord} pelo Revi IA.` : "Extraído do material pelo Revi IA."
              : isMedia ? `Transcrição do ${mediaWord} pelo Revi IA.` : "Leitura de texto do material pelo Revi IA."}
          </p>
        </div>

        {hasText ? (
          <SpeakButton label={isMedia ? `a transcrição deste ${mediaWord}` : "o texto extraído deste material"} text={text} />
        ) : null}

        <Button
          isIconOnly
          variant="ghost"
          size="lg"
          aria-label={isExpanded ? `Recolher ${noun}` : `Expandir ${noun}`}
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
          <span className="text-muted text-sm">{isMedia ? `Lendo a transcrição do ${mediaWord}…` : "Lendo o texto do material…"}</span>
        </div>
      ) : contentStatus === "pending" ? (
        <p className="text-muted flex shrink-0 items-center gap-2 text-sm text-pretty">
          <Sparkles className="size-4 shrink-0" aria-hidden="true" />
          {isMedia ? `O Revi IA ainda está transcrevendo este ${mediaWord}. Isso leva alguns minutos.` : "O Revi IA ainda está processando este material."}
        </p>
      ) : contentStatus === "failed" ? (
        <p role="alert" className="text-danger shrink-0 text-sm text-pretty">
          {processing?.error || (isMedia ? `Não foi possível transcrever o ${mediaWord}. Ele continua disponível para ${mediaKind === "video" ? "assistir" : "ouvir"}.` : "Não foi possível extrair o texto. O download do arquivo continua disponível.")}
        </p>
      ) : contentStatus === "empty" ? (
        <p className="text-muted shrink-0 text-sm text-pretty">
          {isMedia ? `Não encontramos fala neste ${mediaWord}.` : "Nenhum texto legível foi encontrado neste material."}
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
