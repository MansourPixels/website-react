import { Button, Spinner, Tabs, cn } from "@heroui/react";
import { Clock, Loader2, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";

import { ApiError } from "@/api/client";
import { getDownloadUrl } from "@/api/content";
import {
  getMedia,
  getMediaMindMap,
  getTranscript,
  listMediaFlashcards,
  listMediaQuiz,
} from "@/api/media";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { MediaPlayer } from "@/components/MediaPlayer";
import { NavMenu } from "@/components/NavMenu";
import { SpeakButton } from "@/components/SpeakButton";
import type { Flashcard } from "@/types/api/flashcard";
import type { MediaDetail, MediaMindMap, Transcript } from "@/types/api/media";
import type { QuizQuestion } from "@/types/api/quiz";
import {
  MEDIA_POLL_LIMIT_MS,
  describeStatus,
  isProcessing,
  nextPollDelay,
} from "@/utils/mediaStatus";
import {
  activeSegmentIndex,
  clampSeek,
  formatTimestamp,
} from "@/utils/mediaTime";
import { pageMeta } from "@/utils/pageMeta";
import { MediaFlashcardsTab } from "./components/MediaFlashcardsTab";
import { MediaMindMapTab } from "./components/MediaMindMapTab";
import { MediaQuizTab } from "./components/MediaQuizTab";
import { RegenerateArtifacts } from "./components/RegenerateArtifacts";
import { useArtifact } from "./components/useArtifact";

export function meta() {
  return pageMeta({
    title: "Áudio",
    description:
      "Resumo, momentos-chave e transcrição do áudio, com o player para voltar ao ponto certo.",
  });
}

/** Depois de o usuário rolar a transcrição, o acompanhamento automático espera um pouco. */
const MANUAL_SCROLL_PAUSE_MS = 5_000;

const tone: Record<string, string> = {
  neutral: "bg-default text-foreground",
  progress: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
};

export default function MediaMaterialPage() {
  const { pastaId, assuntoId, contentId } = useParams<
    "pastaId" | "assuntoId" | "contentId"
  >() as { pastaId: string; assuntoId: string; contentId: string };

  const [detail, setDetail] = useState<MediaDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isMissing, setIsMissing] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Simulado, flashcards e mapa mental só consultam depois de a aba ser aberta. Os três
  // ficam aqui, e não em cada aba, para o que já chegou sobreviver à troca de aba e para
  // um só "Gerar de novo" reiniciar os três.
  const [openedTabs, setOpenedTabs] = useState<ReadonlySet<string>>(new Set(["resumo"]));
  const audioStatus = detail?.processingStatus ?? "PENDING";
  const quiz = useArtifact<QuizQuestion[]>({
    load: (signal) => listMediaQuiz(contentId, signal),
    isEmpty: (questions) => questions.length === 0,
    signature: (questions) => questions.map((question) => question.id).join(","),
    audioStatus,
    enabled: openedTabs.has("simulado"),
  });
  const flashcards = useArtifact<Flashcard[]>({
    load: (signal) => listMediaFlashcards(contentId, signal),
    isEmpty: (cards) => cards.length === 0,
    signature: (cards) => cards.map((card) => card.id).join(","),
    audioStatus,
    enabled: openedTabs.has("flashcards"),
  });
  const mindMap = useArtifact<MediaMindMap>({
    load: (signal) => getMediaMindMap(contentId, signal),
    isEmpty: (map) => map.raiz === null,
    signature: (map) => map.generatedAt ?? "",
    audioStatus,
    enabled: openedTabs.has("mapa"),
  });
  const regenerateArtifacts = (
    <RegenerateArtifacts
      contentId={contentId}
      onRegenerated={() => {
        quiz.refresh();
        flashcards.refresh();
        mindMap.refresh();
      }}
    />
  );

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const segmentRefs = useRef(new Map<number, HTMLElement>());
  const lastManualScroll = useRef(0);
  const activeIndexRef = useRef(-1);

  // A URL de reprodução não depende do processamento: um áudio que falhou
  // continua tocando, e é o que resta ao usuário fazer com ele.
  useEffect(() => {
    let cancelled = false;

    setAudioUrl(null);
    setAudioError(null);
    getDownloadUrl(contentId)
      .then(({ url }) => {
        if (!cancelled) setAudioUrl(url);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setAudioError(
          error instanceof ApiError
            ? error.detail
            : "Não foi possível carregar o áudio.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [contentId, reloadKey]);

  useEffect(() => {
    const controller = new AbortController();
    const startedAt = Date.now();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;

    setDetail(null);
    setLoadError(null);
    setIsMissing(false);
    setTimedOut(false);

    async function poll() {
      try {
        const result = await getMedia(contentId, controller.signal);

        if (controller.signal.aborted) return;
        setDetail(result);

        if (!isProcessing(result.processingStatus)) return;

        if (Date.now() - startedAt > MEDIA_POLL_LIMIT_MS) {
          setTimedOut(true);
          return;
        }

        timeoutId = setTimeout(poll, nextPollDelay(attempt));
        attempt += 1;
      } catch (error) {
        if (controller.signal.aborted) return;

        if (error instanceof ApiError && error.status === 404) {
          setIsMissing(true);
          return;
        }

        setLoadError(
          error instanceof ApiError
            ? error.detail
            : "Não foi possível carregar este áudio. Tente novamente.",
        );
      }
    }

    void poll();

    return () => {
      controller.abort();
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [contentId, reloadKey]);

  const isCompleted = detail?.processingStatus === "COMPLETED";

  useEffect(() => {
    if (!isCompleted) return;

    const controller = new AbortController();

    setTranscriptError(null);
    getTranscript(contentId, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setTranscript(result);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setTranscriptError(
          error instanceof ApiError
            ? error.detail
            : "Não foi possível carregar a transcrição.",
        );
      });

    return () => controller.abort();
  }, [contentId, isCompleted, reloadKey]);

  const renewUrl = useCallback(
    async () => (await getDownloadUrl(contentId)).url,
    [contentId],
  );

  const segments = transcript?.segments ?? [];
  const activeIndex = activeSegmentIndex(segments, currentTime);

  // Ao abrir a aba no meio da reprodução, a lista já nasce no trecho que está
  // sendo falado, em vez de esperar o próximo segmento para rolar até ele.
  const showActiveSegment = useCallback((list: HTMLElement | null) => {
    if (list === null) return;

    requestAnimationFrame(() =>
      segmentRefs.current
        .get(activeIndexRef.current)
        ?.scrollIntoView({ block: "center" }),
    );
  }, []);

  // Acompanha a fala, a não ser que o usuário tenha acabado de rolar a lista.
  useEffect(() => {
    activeIndexRef.current = activeIndex;

    if (activeIndex < 0) return;
    if (Date.now() - lastManualScroll.current < MANUAL_SCROLL_PAUSE_MS) return;

    segmentRefs.current
      .get(activeIndex)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIndex]);

  function seekTo(seconds: number) {
    const element = audioRef.current;

    if (element === null) return;

    element.currentTime = clampSeek(seconds, detail?.durationSeconds);
    void element.play().catch(() => {});
  }

  if (isMissing) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6 md:p-8">
        <NavMenu title="Áudio" hasBackButton backHref={backHref(pastaId, assuntoId)} />
        <EmptyState>
          Este material foi removido ou não está mais disponível.
        </EmptyState>
      </main>
    );
  }

  const status =
    detail === null
      ? null
      : describeStatus(detail.processingStatus, detail.processingError);
  const summaryText =
    detail?.summary == null
      ? ""
      : [
          detail.summary.summary,
          ...detail.summary.keyPoints,
        ].join("\n");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6 md:p-8">
      <NavMenu
        title={detail?.name ?? "Áudio"}
        hasBackButton
        backHref={backHref(pastaId, assuntoId)}
      />

      <div className="bg-surface shadow-surface sticky top-2 z-10 flex flex-col gap-2 rounded-2xl p-3">
        {audioUrl !== null ? (
          <MediaPlayer
            key={audioUrl}
            src={audioUrl}
            label={detail?.name ?? "Áudio"}
            renewUrl={renewUrl}
            onElement={(element) => {
              audioRef.current = element;
            }}
            onTimeUpdate={setCurrentTime}
          />
        ) : audioError !== null ? (
          <p role="alert" className="text-danger text-sm text-pretty">
            {audioError}
          </p>
        ) : (
          <div className="flex items-center gap-2 py-2" aria-busy="true">
            <Spinner size="sm" />
            <span className="text-muted text-sm">Carregando o áudio…</span>
          </div>
        )}

        {detail !== null && status !== null ? (
          <p
            role="status"
            className="text-muted flex flex-wrap items-center gap-2 text-xs"
          >
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
                tone[status.tone],
              )}
            >
              {isProcessing(detail.processingStatus) ? (
                <Loader2 className="size-3 animate-spin" aria-hidden />
              ) : detail.processingStatus === "FAILED" ? (
                <TriangleAlert className="size-3" aria-hidden />
              ) : null}
              {status.label}
            </span>
            {detail.durationSeconds != null ? (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Clock className="size-3" aria-hidden />
                {formatTimestamp(detail.durationSeconds)}
              </span>
            ) : null}
          </p>
        ) : null}
      </div>

      {loadError !== null ? (
        <ErrorState onRetry={() => setReloadKey((key) => key + 1)}>
          {loadError}
        </ErrorState>
      ) : detail === null ? (
        <div className="flex items-center justify-center p-6" aria-busy="true">
          <Spinner size="lg" />
          <span className="sr-only">Carregando o áudio</span>
        </div>
      ) : detail.processingStatus === "FAILED" ? (
        <div role="alert" className="text-danger flex flex-col gap-2 text-sm text-pretty">
          <p className="font-medium">Não foi possível processar este áudio.</p>
          {status?.showError ? <p>{detail.processingError}</p> : null}
          <p className="text-muted">
            O áudio continua disponível para ouvir acima. Para ter a transcrição
            e o resumo, envie o arquivo de novo.
          </p>
        </div>
      ) : isProcessing(detail.processingStatus) ? (
        <div className="text-muted flex flex-col gap-3 text-sm text-pretty">
          <p className="flex items-center gap-2">
            <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
            {detail.processingStatus === "PENDING"
              ? "O áudio está na fila para ser transcrito."
              : "Estamos transcrevendo o áudio e preparando o resumo."}{" "}
            Isso costuma levar alguns minutos, e você pode sair desta tela.
          </p>
          {timedOut ? (
            <div role="alert" className="flex flex-col items-start gap-2">
              <p>
                Está demorando mais do que o normal. O processamento continua no
                servidor.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onPress={() => setReloadKey((key) => key + 1)}
              >
                Verificar de novo
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <Tabs
          defaultSelectedKey="resumo"
          onSelectionChange={(key) =>
            setOpenedTabs((opened) => new Set(opened).add(String(key)))
          }
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label="Conteúdo do áudio">
              <Tabs.Tab id="resumo" className="whitespace-nowrap">
                Resumo
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="momentos" className="whitespace-nowrap">
                Momentos (
                <span className="tabular-nums">{detail.keyMoments.length}</span>)
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="transcricao" className="whitespace-nowrap">
                Transcrição
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="simulado" className="whitespace-nowrap">
                Simulado
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="flashcards" className="whitespace-nowrap">
                Flashcards
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="mapa" className="whitespace-nowrap">
                Mapa mental
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>

          <Tabs.Panel id="resumo" className="flex flex-col gap-4 pt-4">
            {detail.summary === null ? (
              <EmptyState>Este áudio ainda não tem resumo.</EmptyState>
            ) : (
              <>
                <div className="flex items-start gap-2">
                  <p className="flex-1 text-pretty leading-relaxed">
                    {detail.summary.summary}
                  </p>
                  {summaryText.length > 0 ? (
                    <SpeakButton label="o resumo do áudio" text={summaryText} />
                  ) : null}
                </div>
                {detail.summary.topics.length > 0 ? (
                  <section aria-label="Tópicos">
                    <h2 className="mb-2 font-semibold">Tópicos</h2>
                    <ul className="flex flex-wrap gap-2">
                      {detail.summary.topics.map((topic) => (
                        <li
                          key={topic}
                          className="bg-default rounded-full px-3 py-1 text-sm"
                        >
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
                {detail.summary.keyPoints.length > 0 ? (
                  <section aria-label="Pontos-chave">
                    <h2 className="mb-2 font-semibold">Pontos-chave</h2>
                    <ul className="list-disc space-y-1 pl-5 text-pretty">
                      {detail.summary.keyPoints.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </>
            )}
          </Tabs.Panel>

          <Tabs.Panel id="momentos" className="pt-4">
            {detail.keyMoments.length === 0 ? (
              <EmptyState>
                Nenhum momento-chave foi identificado neste áudio.
              </EmptyState>
            ) : (
              <ul className="flex flex-col gap-2">
                {detail.keyMoments.map((moment) => (
                  <li key={`${moment.startSeconds}-${moment.title}`}>
                    <button
                      type="button"
                      aria-label={`Ir para ${formatTimestamp(moment.startSeconds)}: ${moment.title}`}
                      className="bg-surface shadow-surface hover:bg-default flex min-h-11 w-full items-start gap-3 rounded-xl p-3 text-left"
                      onClick={() => seekTo(moment.startSeconds)}
                    >
                      <span className="bg-accent-soft text-accent shrink-0 rounded-lg px-2 py-1 text-xs font-semibold tabular-nums">
                        {formatTimestamp(moment.startSeconds)}
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="font-medium text-pretty">
                          {moment.title}
                        </span>
                        {moment.description.length > 0 ? (
                          <span className="text-muted text-sm text-pretty">
                            {moment.description}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Tabs.Panel>

          <Tabs.Panel id="transcricao" className="pt-4">
            {transcriptError !== null ? (
              <ErrorState onRetry={() => setReloadKey((key) => key + 1)}>
                {transcriptError}
              </ErrorState>
            ) : transcript === null ? (
              <div className="flex items-center gap-2 py-2" aria-busy="true">
                <Spinner size="sm" />
                <span className="text-muted text-sm">Carregando a transcrição…</span>
              </div>
            ) : segments.length === 0 ? (
              <EmptyState>Não encontramos fala neste áudio.</EmptyState>
            ) : (
              <ol
                ref={showActiveSegment}
                aria-label="Transcrição"
                className="flex max-h-[60svh] flex-col gap-1 overflow-y-auto overscroll-contain"
                onWheel={() => {
                  lastManualScroll.current = Date.now();
                }}
                onTouchMove={() => {
                  lastManualScroll.current = Date.now();
                }}
              >
                {segments.map((segment, index) => (
                  <li
                    key={`${segment.startSeconds}-${index}`}
                    ref={(element) => {
                      if (element) segmentRefs.current.set(index, element);
                      else segmentRefs.current.delete(index);
                    }}
                  >
                    <button
                      type="button"
                      aria-label={`Ir para ${formatTimestamp(segment.startSeconds)}`}
                      aria-current={index === activeIndex ? "true" : undefined}
                      className={cn(
                        "flex min-h-11 w-full items-start gap-3 rounded-lg p-2 text-left",
                        index === activeIndex
                          ? "bg-accent-soft"
                          : "hover:bg-default",
                      )}
                      onClick={() => seekTo(segment.startSeconds)}
                    >
                      <span className="text-muted shrink-0 pt-0.5 text-xs tabular-nums">
                        {formatTimestamp(segment.startSeconds)}
                      </span>
                      <span className="text-pretty">{segment.text.trim()}</span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </Tabs.Panel>
          <Tabs.Panel id="simulado" className="flex flex-col gap-4 pt-4">
            {regenerateArtifacts}
            <MediaQuizTab
              key={quiz.data?.map((question) => question.id).join(",") ?? "vazio"}
              contentId={contentId}
              quiz={quiz}
              onSeek={seekTo}
            />
          </Tabs.Panel>

          <Tabs.Panel id="flashcards" className="flex flex-col gap-4 pt-4">
            {regenerateArtifacts}
            <MediaFlashcardsTab
              key={flashcards.data?.map((card) => card.id).join(",") ?? "vazio"}
              cards={flashcards}
              onSeek={seekTo}
            />
          </Tabs.Panel>

          <Tabs.Panel id="mapa" className="flex flex-col gap-4 pt-4">
            {regenerateArtifacts}
            <MediaMindMapTab map={mindMap} onSeek={seekTo} />
          </Tabs.Panel>
        </Tabs>
      )}
    </main>
  );
}

function backHref(pastaId: string, assuntoId: string) {
  return `/pastas/${pastaId}/assuntos/${assuntoId}`;
}
