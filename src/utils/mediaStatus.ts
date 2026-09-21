import type { Content, ProcessingStatus } from "@/types/api/content";

import { isMediaType } from "./materials";

/** PDF e imagem levam segundos: continuam com o limite curto de sempre. */
export const DOCUMENT_POLL_LIMIT_MS = 60_000;

/** Uma transcrição leva minutos, e uma aula longa passa de meia hora só em transcrever. */
export const MEDIA_POLL_LIMIT_MS = 30 * 60_000;

const FAST_POLL_MS = 3_000;
const SLOW_POLL_MS = 10_000;
const FAST_POLL_ATTEMPTS = 10;

export function isProcessing(status: ProcessingStatus | undefined): boolean {
  return status === "PENDING" || status === "PROCESSING";
}

/**
 * O status de qualquer material. O backend novo manda `processingStatus` para
 * todos; um mais antigo não manda, e aí `hasSummary` diz se terminou, como
 * sempre disse.
 */
export function effectiveStatus(
  content: Pick<Content, "processingStatus" | "hasSummary">,
): ProcessingStatus {
  if (content.processingStatus !== undefined) return content.processingStatus;

  return content.hasSummary ? "COMPLETED" : "PROCESSING";
}

/** Falso para o que já terminou, inclusive o que falhou: não há o que esperar. */
export function needsPolling(
  content: Pick<Content, "processingStatus" | "hasSummary">,
): boolean {
  return isProcessing(effectiveStatus(content));
}

/** Enquanto houver um áudio em andamento o limite é o longo; só documentos, o curto. */
export function pollLimitMs(
  contents: readonly Pick<
    Content,
    "contentType" | "processingStatus" | "hasSummary"
  >[],
): number {
  return contents.some(
    (content) => isMediaType(content.contentType) && needsPolling(content),
  )
    ? MEDIA_POLL_LIMIT_MS
    : DOCUMENT_POLL_LIMIT_MS;
}

/** 3 s nas primeiras tentativas (o caso comum é curto), depois 10 s para não martelar a API. */
export function nextPollDelay(attempt: number): number {
  return attempt < FAST_POLL_ATTEMPTS ? FAST_POLL_MS : SLOW_POLL_MS;
}

export type StatusTone = "neutral" | "progress" | "success" | "danger";

export interface StatusDescription {
  label: string;
  tone: StatusTone;
  /** Só uma falha mostra o motivo, e só quando o backend mandou um. */
  showError: boolean;
}

export function describeStatus(
  status: ProcessingStatus,
  error: string | null | undefined,
): StatusDescription {
  switch (status) {
    case "PENDING":
      return { label: "Na fila", tone: "neutral", showError: false };
    case "PROCESSING":
      return { label: "Processando", tone: "progress", showError: false };
    case "COMPLETED":
      return { label: "Pronto", tone: "success", showError: false };
    case "FAILED":
      return {
        label: "Falhou",
        tone: "danger",
        showError: typeof error === "string" && error.trim().length > 0,
      };
  }
}
