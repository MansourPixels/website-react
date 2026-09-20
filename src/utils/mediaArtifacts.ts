import type { ProcessingStatus } from "@/types/api/content";
import type { GradeResultItem } from "@/types/api/quiz";
import type { MindMapBranch } from "@/types/api/mindMap";

import { formatTimestamp } from "./mediaTime";

/** De quanto em quanto tempo um artefato vazio de um áudio pronto é consultado de novo. */
export const ARTIFACT_POLL_MS = 3_000;

/** Depois disto a geração é dada por demorada e a saída passa a ser "Gerar de novo". */
export const ARTIFACT_POLL_LIMIT_MS = 60_000;

export type ArtifactPhase =
  /** O áudio ainda está sendo processado: os artefatos nascem depois, e nada é consultado. */
  | "waiting-audio"
  /** O áudio falhou: não há transcrição de onde gerar. */
  | "audio-failed"
  /** Vazio de um áudio pronto: a geração está em andamento, continuar consultando. */
  | "generating"
  /** Continuou vazio além do limite: parar de consultar e oferecer "Gerar de novo". */
  | "timed-out"
  | "ready";

/**
 * Em que pé está um artefato (simulado, flashcards ou mapa mental) de um áudio.
 * Uma falha de geração não tem sinal próprio, então "vazio por muito tempo" é
 * tudo o que a distingue de "ainda gerando".
 */
export function artifactPhase({
  audioStatus,
  isEmpty,
  elapsedMs,
}: {
  audioStatus: ProcessingStatus;
  isEmpty: boolean;
  elapsedMs: number;
}): ArtifactPhase {
  if (audioStatus === "FAILED") return "audio-failed";
  if (audioStatus !== "COMPLETED") return "waiting-audio";
  if (!isEmpty) return "ready";

  return elapsedMs < ARTIFACT_POLL_LIMIT_MS ? "generating" : "timed-out";
}

/** Só o que está sendo gerado é consultado de novo; o resto já é um estado final para o polling. */
export function shouldPollArtifact(phase: ArtifactPhase): boolean {
  return phase === "generating";
}

/**
 * Os erros de um simulado que dizem onde no áudio a resposta está, na ordem do
 * áudio (e não na das perguntas), para o "Rever este momento". Sem momento,
 * não há o que rever.
 */
export function reviewMoments(
  results: readonly GradeResultItem[],
): (GradeResultItem & { startSeconds: number })[] {
  return results
    .filter(
      (result): result is GradeResultItem & { startSeconds: number } =>
        !result.correct && typeof result.startSeconds === "number",
    )
    .sort((left, right) => left.startSeconds - right.startSeconds);
}

/** O rótulo do atalho ("Ir para 12:34"), ou `null` quando o item não tem momento. */
export function seekLabel(startSeconds: number | null | undefined): string | null {
  if (typeof startSeconds !== "number" || !Number.isFinite(startSeconds) || startSeconds < 0) {
    return null;
  }

  return `Ir para ${formatTimestamp(startSeconds)}`;
}

/**
 * O backend manda `null` nos campos opcionais de um nó do mapa do áudio; o mapa
 * da pasta e o layout usam campo ausente (`detalhe !== undefined`), e um `null`
 * viraria o texto "null" na tela. Devolve a árvore com só o que tem valor.
 */
export function normalizeMindMapBranch(branch: MindMapBranch): MindMapBranch {
  const children = branch.children ?? [];

  return {
    id: branch.id,
    label: branch.label,
    ...(isPresent(branch.detalhe) ? { detalhe: branch.detalhe } : {}),
    ...(isPresent(branch.formula) ? { formula: branch.formula } : {}),
    ...(typeof branch.startSeconds === "number" ? { startSeconds: branch.startSeconds } : {}),
    ...(children.length > 0 ? { children: children.map(normalizeMindMapBranch) } : {}),
  };
}

function isPresent(text: string | null | undefined): text is string {
  return typeof text === "string" && text.trim().length > 0;
}
