import type { ContentType, ProcessingStatus } from "./content";
import type { MindMapBranch } from "./mindMap";

/** Resumo gerado a partir da transcrição; o mesmo shape do resumo de qualquer material. */
export interface MediaSummary {
  summary: string;
  topics: string[];
  keyPoints: string[];
}

/** Um ponto do áudio ao qual vale voltar, com o segundo em que começa. */
export interface KeyMoment {
  startSeconds: number;
  title: string;
  description: string;
}

/**
 * Detalhe de um áudio. `summary` é `null` e `keyMoments` vem vazio até o
 * processamento terminar; `keyMoments` já vem ordenado por `startSeconds`.
 */
export interface MediaDetail {
  id: string;
  name: string;
  contentType: ContentType;
  processingStatus: ProcessingStatus;
  processingError: string | null;
  durationSeconds: number | null;
  summary: MediaSummary | null;
  keyMoments: KeyMoment[];
}

/** Um trecho falado, com tempos em segundos (fracionários) desde o início do áudio. */
export interface TranscriptSegment {
  startSeconds: number;
  endSeconds: number;
  text: string;
}

/**
 * Antes de existir transcrição o backend responde `200` com `segments: []` e
 * `transcribedAt: null`: é um estado válido para o polling, não um erro.
 */
export interface Transcript {
  language: string | null;
  durationSeconds: number | null;
  segments: TranscriptSegment[];
  transcribedAt: string | null;
}

/** O mapa mental de um áudio: `raiz` e `generatedAt` são `null` enquanto ele não foi gerado. */
export interface MediaMindMap {
  raiz: MindMapBranch | null;
  generatedAt: string | null;
}
