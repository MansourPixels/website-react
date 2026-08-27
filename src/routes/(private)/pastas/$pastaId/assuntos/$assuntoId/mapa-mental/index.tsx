import { Button, ProgressBar, Spinner } from "@heroui/react";
import { Sparkles, Waypoints } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { MindMapCanvas } from "@/components/MindMapCanvas";
import { NavMenu } from "@/components/NavMenu";
import { useMindMap } from "@/hooks/useMindMap";
import { generateMindMap, type MindMapData } from "@/mocks/mindMap";
import { MindMapSummary } from "./components/MindMapSummary";

export default function MindMapPage() {
  const { pastaId, assuntoId } = useParams<"pastaId" | "assuntoId">() as {
    pastaId: string;
    assuntoId: string;
  };
  const navigate = useNavigate();

  const [map, setMap] = useState<MindMapData | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  // Enquanto o mapa não chega, esta página não toca no DOM do canvas — é o
  // que mantém o React Flow fora do render do servidor.
  useEffect(() => {
    let isCurrent = true;

    generateMindMap().then((generated) => {
      if (!isCurrent) return;
      setMap(generated);
    });

    return () => {
      isCurrent = false;
    };
  }, []);

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
    <main className="content-bg-cyan-200 h-[100svh] overflow-hidden flex flex-col">
      <div className="py-6 md:py-8 gap-4 flex flex-col flex-1 min-h-0 w-full mx-auto">
        <div className="max-w-4xl mx-auto w-full px-6 md:px-8">
          <NavMenu
            title="Mapa Mental"
            hasBackButton
            className="text-center pr-12 mb-3"
          />
          <ProgressBar
            aria-label="Progresso"
            size="lg"
            value={total === 0 ? 0 : (revealedCount / total) * 100}
          >
            <ProgressBar.Track>
              <ProgressBar.Fill className="bg-cyan-600" />
            </ProgressBar.Track>
          </ProgressBar>
        </div>

        {map === null ? (
          <section
            aria-busy
            className="flex-1 flex flex-col items-center justify-center gap-3 text-center"
          >
            <Spinner size="lg" />
            <p className="flex items-center gap-2 font-medium">
              <Sparkles className="size-4" />
              Revi IA está montando o seu mapa...
            </p>
            <p className="text-muted text-sm max-w-xs">
              Estamos organizando os conceitos deste assunto em ramos para você
              percorrer.
            </p>
          </section>
        ) : isFinished ? (
          <MindMapSummary
            revealedCount={revealedCount}
            total={total}
            onRestart={restartMap}
            onFinish={() =>
              navigate(`/pastas/${pastaId}/assuntos/${assuntoId}`)
            }
          />
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
              <Button fullWidth size="lg" onClick={() => setIsFinished(true)}>
                <Waypoints />
                Concluí o mapa
              </Button>
              <Button
                fullWidth
                size="lg"
                variant="tertiary"
                onClick={expandAll}
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
