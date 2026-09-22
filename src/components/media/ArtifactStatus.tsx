import { Button, Spinner } from "@heroui/react";

import { ErrorState } from "@/components/ErrorState";
import type { ArtifactState } from "./useArtifact";

interface ArtifactStatusProps {
  /** "áudio" ou "vídeo", para os textos. */
  noun?: "áudio" | "vídeo";
  /** O nome do artefato no texto: "o simulado", "os flashcards", "o mapa mental". */
  name: string;
  state: Pick<ArtifactState<unknown>, "phase" | "error" | "retry">;
}

/**
 * O que uma aba mostra quando ainda não há artefato para mostrar: carregando,
 * gerando, demorado demais, ou um erro. Devolve `null` quando está pronto.
 */
export function ArtifactStatus({ name, state, noun = "áudio" }: ArtifactStatusProps) {
  if (state.error !== null) {
    return <ErrorState onRetry={state.retry}>{state.error}</ErrorState>;
  }

  switch (state.phase) {
    case "ready":
    case "idle":
      return null;
    case "loading":
      return (
        <div className="flex items-center justify-center p-6" aria-busy="true">
          <Spinner size="lg" />
          <span className="sr-only">Carregando {name}</span>
        </div>
      );
    case "generating":
      return (
        <div role="status" className="flex flex-col items-center gap-3 py-8 text-center">
          <Spinner size="lg" />
          <p className="text-muted text-pretty">
            Gerando {name} a partir da transcrição. Isso costuma levar
            menos de um minuto, e esta tela se atualiza sozinha.
          </p>
        </div>
      );
    case "timed-out":
      return (
        <div role="alert" className="flex flex-col items-start gap-3 py-4 text-pretty">
          <p>
            A geração de {name} está demorando mais do que o normal, ou não deu
            certo. Use “Gerar de novo” acima, ou consulte outra vez.
          </p>
          <Button variant="secondary" size="sm" onPress={state.retry}>
            Consultar de novo
          </Button>
        </div>
      );
    case "waiting-audio":
      return (
        <p role="status" className="text-muted text-pretty">
          O {noun} ainda não terminou de ser processado. {name[0].toUpperCase()}
          {name.slice(1)} aparece quando ele ficar pronto.
        </p>
      );
    case "audio-failed":
      return (
        <p role="alert" className="text-danger text-pretty">
          O {noun} não foi processado, então não há de onde gerar {name}.
        </p>
      );
  }
}
