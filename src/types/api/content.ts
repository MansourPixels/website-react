export type ContentType = "PDF" | "IMAGE";

export interface Content {
  id: string;
  name: string;
  contentType: ContentType;
  childFolderId: string;
  hasSummary: boolean;
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
 * Texto extraído de um conteúdo por OCR. O backend já roda OCR no pipeline de
 * categorização; isto é o que falta expor. Ver `OCR.md`.
 */
export interface ContentText {
  contentId: string;
  text: string;
  /** `null` enquanto o pipeline de OCR ainda não terminou. */
  extractedAt: string | null;
}
