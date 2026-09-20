import { useEffect, useEffectEvent, useRef, useState } from "react";

import { ApiError } from "@/api/client";
import type { ProcessingStatus } from "@/types/api/content";
import {
  ARTIFACT_POLL_MS,
  artifactPhase,
  shouldPollArtifact,
  type ArtifactPhase,
} from "@/utils/mediaArtifacts";

interface UseArtifactOptions<T> {
  load: (signal: AbortSignal) => Promise<T>;
  /** Lista vazia ou mapa sem raiz: o que o backend responde enquanto o artefato não foi gerado. */
  isEmpty: (data: T) => boolean;
  /**
   * Identifica uma geração (os ids das perguntas, o `generatedAt` do mapa). Depois de
   * `refresh`, o artefato só conta como pronto quando a assinatura muda: até lá o que
   * o backend devolve ainda é o antigo.
   */
  signature: (data: T) => string;
  audioStatus: ProcessingStatus;
  /** Só a aba já aberta consulta: uma aba nunca vista não faz request. */
  enabled: boolean;
}

export interface ArtifactState<T> {
  data: T | null;
  phase: ArtifactPhase | "idle" | "loading";
  error: string | null;
  /** Consulta de novo, do zero: depois de um erro ou de uma geração que passou do limite. */
  retry: () => void;
  /** Depois de pedir uma nova geração: espera o backend trocar o artefato. */
  refresh: () => void;
}

/**
 * Um artefato de um áudio (simulado, flashcards ou mapa mental). Consulta ao ser
 * habilitado e, enquanto estiver vazio (ou ainda o de antes de um `refresh`), de novo a
 * cada poucos segundos até o limite (`artifactPhase` decide); sair da tela cancela o
 * request e o timer. O resultado fica no estado, então voltar à aba não consulta outra vez.
 */
export function useArtifact<T>({
  load,
  isEmpty,
  signature,
  audioStatus,
  enabled,
}: UseArtifactOptions<T>): ArtifactState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [attempt, setAttempt] = useState(0);
  // A assinatura a superar; `null` quando basta o artefato existir.
  const baseline = useRef<string | null>(null);

  const active = enabled && audioStatus === "COMPLETED";
  const loadLatest = useEffectEvent((signal: AbortSignal) => load(signal));
  const isEmptyLatest = useEffectEvent((value: T) => isEmpty(value));
  const signatureLatest = useEffectEvent((value: T) => signature(value));

  useEffect(() => {
    if (!active) return;

    const controller = new AbortController();
    const startedAt = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      try {
        const result = await loadLatest(controller.signal);

        if (controller.signal.aborted) return;

        const elapsed = Date.now() - startedAt;
        const pending =
          isEmptyLatest(result) ||
          (baseline.current !== null && signatureLatest(result) === baseline.current);
        const phase = artifactPhase({
          audioStatus: "COMPLETED",
          isEmpty: pending,
          elapsedMs: elapsed,
        });

        setData(result);
        setIsPending(pending);
        setElapsedMs(elapsed);

        if (shouldPollArtifact(phase)) timer = setTimeout(poll, ARTIFACT_POLL_MS);
      } catch (caught) {
        if (controller.signal.aborted) return;

        setError(
          caught instanceof ApiError
            ? caught.detail
            : "Não foi possível carregar. Tente novamente.",
        );
      }
    }

    void poll();

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [active, attempt]);

  function restart() {
    setError(null);
    setIsPending(true);
    setElapsedMs(0);
    setAttempt((current) => current + 1);
  }

  function retry() {
    restart();
  }

  function refresh() {
    baseline.current = data === null || isEmpty(data) ? null : signature(data);
    restart();
  }

  if (audioStatus !== "COMPLETED") {
    return {
      data: null,
      phase: artifactPhase({ audioStatus, isEmpty: true, elapsedMs: 0 }),
      error: null,
      retry,
      refresh,
    };
  }
  if (!active) return { data: null, phase: "idle", error: null, retry, refresh };
  if (error !== null) return { data, phase: "loading", error, retry, refresh };
  if (data === null) return { data, phase: "loading", error: null, retry, refresh };

  return {
    data,
    phase: artifactPhase({ audioStatus, isEmpty: isPending, elapsedMs }),
    error: null,
    retry,
    refresh,
  };
}
