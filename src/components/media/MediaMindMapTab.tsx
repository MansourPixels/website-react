import { Button } from "@heroui/react";
import { Maximize2 } from "lucide-react";

import { MindMapCanvas } from "@/components/MindMapCanvas";
import { useMindMap } from "@/hooks/useMindMap";
import type { MediaMindMap } from "@/types/api/media";
import type { MindMapBranch } from "@/types/api/mindMap";
import { ArtifactStatus } from "./ArtifactStatus";
import type { ArtifactState } from "./useArtifact";

interface MediaMindMapTabProps {
  map: ArtifactState<MediaMindMap>;
  noun?: "áudio" | "vídeo";
  onSeek: (seconds: number) => void;
}

/** O mapa mental do próprio áudio; um nó com momento ganha o atalho "Ir para m:ss". */
export function MediaMindMapTab({ map, onSeek, noun = "áudio" }: MediaMindMapTabProps) {
  if (map.data === null || map.data.raiz === null || map.phase !== "ready" || map.error !== null) {
    return <ArtifactStatus name="o mapa mental" state={map} noun={noun} />;
  }

  return <MapView root={map.data.raiz} onSeek={onSeek} noun={noun} />;
}

function MapView({ root, onSeek, noun }: { root: MindMapBranch; onSeek: (seconds: number) => void; noun: string }) {
  const { placements, toggle, expandAll } = useMindMap(root);

  return (
    <section aria-label={`Mapa mental do ${noun}`} className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button variant="secondary" size="sm" onPress={expandAll}>
          <Maximize2 />
          Expandir tudo
        </Button>
      </div>
      {/* Altura própria: o canvas do React Flow precisa de um pai com altura definida. */}
      <div className="h-[65vh] min-h-96 overscroll-contain overflow-hidden rounded-2xl">
        <MindMapCanvas
          root={root}
          placements={placements}
          onToggle={toggle}
          onSeek={onSeek}
          fitKey={placements.length}
        />
      </div>
    </section>
  );
}
