export type ContentType = "PDF" | "IMAGE" | "AUDIO";

/**
 * Onde o processamento assíncrono do material está. `PENDING` logo após o
 * envio, `PROCESSING` enquanto um worker cuida dele, e termina em `COMPLETED`
 * ou `FAILED` (final: enviar de novo é a saída).
 */
export type ProcessingStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export interface Content {
  id: string;
  name: string;
  contentType: ContentType;
  childFolderId: string;
  hasSummary: boolean;
  /**
   * Opcionais no tipo porque um backend anterior à fase de áudio não os envia;
   * quem lê trata a ausência como PDF/imagem antigos (ver `mediaStatus.ts`).
   */
  processingStatus?: ProcessingStatus;
  /** Mensagem segura para exibir; só existe quando o status é `FAILED`. */
  processingError?: string | null;
  /** Duração em segundos; só para áudio, depois que a transcrição existe. */
  durationSeconds?: number | null;
}

export interface FolderSuggestion {
  matched: boolean;
  motherFolderId: string | null;
  childFolderId: string | null;
  suggestedMotherFolderName: string | null;
  suggestedChildFolderName: string | null;
}

export interface DownloadUrlResponse {
  url: string;
}

/**
 * Texto extraído de um conteúdo pelo pipeline de categorização. Ver `OCR.md`.
 */
export interface ContentText {
  contentId: string;
  text: string;
  /** `null` enquanto o pipeline de OCR ainda não terminou. */
  extractedAt: string | null;
}
