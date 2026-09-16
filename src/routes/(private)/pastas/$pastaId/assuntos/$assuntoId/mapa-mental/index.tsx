import { Button, ProgressBar, Spinner } from "@heroui/react";
import { Sparkles, Waypoints } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { ApiError } from "@/api/client";
import { getMindMap } from "@/api/mindMap";
import { ErrorState } from "@/components/ErrorState";
import { MindMapCanvas } from "@/components/MindMapCanvas";
import { NavMenu } from "@/components/NavMenu";
import { useMindMap } from "@/hooks/useMindMap";
import type { MindMap } from "@/types/api/mindMap";
import { MindMapSummary } from "./components/MindMapSummary";

// Enquanto o mapa ainda não foi gerado (raiz: null), reconsulta a cada ~3s;
// desiste depois de ~60s para não pollar para sempre.
const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 60_000;

export default function MindMapPage() {
  const { pastaId, assuntoId } = useParams<"pastaId" | "assuntoId">() as {
    pastaId: string;
    assuntoId: string;
  };
  const navigate = useNavigate();

  const [map, setMap] = useState<MindMap | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Enquanto o mapa não chega, esta página não toca no DOM do canvas — é o
  // que mantém o React Flow fora do render do servidor.
  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();

    setMap(null);
    setLoadError(null);
    setTimedOut(false);

    async function poll() {
      try {
        const result = await getMindMap(assuntoId);

        if (cancelled) return;

        setMap(result);

        const stillGenerating = result.raiz === null;
        const isTimedOut = Date.now() - startedAt > POLL_TIMEOUT_MS;

        if (stillGenerating && !isTimedOut) {
          timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
        } else if (stillGenerating) {
          setTimedOut(true);
        }
      } catch (error) {
        if (cancelled) return;

        setLoadError(
          error instanceof ApiError
            ? error.detail
            : "Não foi possível carregar o mapa mental. Tente novamente.",
        );
      }
    }

    poll();

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [assuntoId, reloadKey]);

  const {
    placements,
    revealedCount,
    total,
    isComplete,
    toggle,
    expandAll,
    reset,
  } = useMindMap(map?.raiz ?? null);

  function restartMap() {
    reset();
    setIsFinished(false);
  }

  return (
    // `flex-1 min-h-0` e não `h-[100svh]`: com a ilha de sessão em curso o
    // contêiner de rota ganha `pt-(--island-inset)`, e uma altura de viewport
    // inteira empurraria o rodapé para fora da tela.
    <main className="content-bg-cyan-200 flex-1 min-h-0 overflow-hidden flex flex-col">
      <div className="py-6 md:py-8 gap-4 flex flex-col flex-1 min-h-0 w-full mx-auto">
        <div className="max-w-4xl mx-auto w-full px-6 md:px-8">
          <NavMenu
            title="Mapa Mental"
            hasBackButton
            className="text-center pr-12 mb-3"
          />
          {/* Enquanto não há mapa, uma barra em 0% seria progresso falso. */}
          {loadError === null && map?.raiz != null && total > 0 ? (
            <ProgressBar
              aria-label="Progresso"
              size="lg"
              value={(revealedCount / total) * 100}
            >
              <ProgressBar.Track>
                <ProgressBar.Fill className="bg-cyan-600" />
              </ProgressBar.Track>
            </ProgressBar>
          ) : null}
        </div>

        {loadError !== null ? (
          <div className="flex-1 flex items-center justify-center px-6">
            <ErrorState onRetry={() => setReloadKey((k) => k + 1)}>
              {loadError}
            </ErrorState>
          </div>
        ) : map?.raiz == null ? (
          <section
            aria-busy={!timedOut}
            className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6"
          >
            {/* Quando o polling desiste, um spinner girando prometeria um
                desfecho que não vem mais — some, e sobra a saída. */}
            {timedOut ? null : <Spinner size="lg" />}
            <p className="flex items-center gap-2 font-medium">
              <Sparkles className="size-4" />
              {timedOut
                ? "O mapa ainda não ficou pronto"
                : "Revi IA está montando o seu mapa..."}
            </p>
            <p className="text-muted text-sm max-w-xs text-pretty">
              {timedOut
                ? "A geração está demorando mais que o normal. Tente novamente em instantes."
                : "Estamos organizando os conceitos deste assunto em ramos para você percorrer."}
            </p>
            {timedOut ? (
              <Button
                variant="secondary"
                size="sm"
                onPress={() => setReloadKey((k) => k + 1)}
              >
                Tentar novamente
              </Button>
            ) : null}
          </section>
        ) : isFinished ? (
          // O resumo é a única parte desta tela que rola; o resto da página é
          // canvas de altura fixa.
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-8 max-w-4xl mx-auto w-full px-6 md:px-8">
            <MindMapSummary
              revealedCount={revealedCount}
              total={total}
              onRestart={restartMap}
              onFinish={() =>
                navigate(`/pastas/${pastaId}/assuntos/${assuntoId}`)
              }
            />
          </div>
        ) : (
          <>
            {/* min-h-0 é o que dá altura real ao canvas dentro do flex column. */}
            <div className="flex-1 min-h-0 overscroll-contain rounded-2xl overflow-hidden">
              <MindMapCanvas
                root={map.raiz}
                placements={placements}
                onToggle={toggle}
                fitKey={placements.length}
              />
            </div>

            <footer className="flex flex-col gap-3 sm:flex-row-reverse max-w-4xl mx-auto w-full px-6 md:px-8">
              <Button fullWidth size="lg" onPress={() => setIsFinished(true)}>
                <Waypoints />
                Concluí o mapa
              </Button>
              <Button
                fullWidth
                size="lg"
                variant="tertiary"
                onPress={expandAll}
                isDisabled={isComplete}
              >
                Expandir tudo
              </Button>
            </footer>
          </>
        )}
      </div>
    </main>
  );
}
