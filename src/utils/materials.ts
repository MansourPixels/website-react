import type { MaterialKind } from "@/types/Material";

export const ACCEPTED_MATERIAL_TYPES = "image/*,application/pdf";

export function isAcceptedMaterial(file: File | Blob) {
  return file.type.startsWith("image/") || file.type === "application/pdf";
}

export function materialKindOf(file: File | Blob): MaterialKind {
  return file.type === "application/pdf" ? "pdf" : "image";
}

export function materialKindLabel(kind: MaterialKind) {
  return kind === "pdf" ? "PDF" : "imagem";
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;

  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) return `${Math.round(kilobytes)} KB`;

  return `${(kilobytes / 1024).toFixed(1).replace(".", ",")} MB`;
}
