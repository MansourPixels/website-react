import type { ContentType } from "@/types/api/content";

// Um arquivo pronto para ser exibido (preview local pré-upload ou já
// enviado, via URL presignada) — não corresponde a um Content da API.
export interface ViewableFile {
  name: string;
  url: string;
  contentType: ContentType;
}

// ViewableFile + o blob original, necessário só até o upload acontecer.
export interface CapturedFile extends ViewableFile {
  blob: File | Blob;
}
