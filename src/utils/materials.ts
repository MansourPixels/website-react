import type { ContentType } from "@/types/api/content";

export const ACCEPTED_MATERIAL_TYPES = "image/*,application/pdf";

export function isAcceptedMaterial(file: File | Blob) {
  return file.type.startsWith("image/") || file.type === "application/pdf";
}

export function contentTypeOf(file: File | Blob): ContentType {
  return file.type === "application/pdf" ? "PDF" : "IMAGE";
}

export function contentTypeLabel(contentType: ContentType) {
  return contentType === "PDF" ? "PDF" : "imagem";
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;

  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) return `${Math.round(kilobytes)} KB`;

  return `${(kilobytes / 1024).toFixed(1).replace(".", ",")} MB`;
}

// Fotos da câmera chegam como Blob sem nome/extensão, e o back valida a
// extensão do arquivo (não só o Content-Type) contra o contentType
// declarado — garante um nome com a extensão certa antes do upload.
export function ensureUploadFilename(
  file: File | Blob,
  contentType: ContentType,
): File {
  const hasValidExtension =
    file instanceof File &&
    file.name.length > 0 &&
    (contentType === "PDF"
      ? /\.pdf$/i.test(file.name)
      : /\.(jpe?g|png)$/i.test(file.name));

  if (hasValidExtension) return file as File;

  const extension =
    contentType === "PDF" ? "pdf" : file.type === "image/png" ? "png" : "jpg";

  return new File([file], `captura-${Date.now()}.${extension}`, {
    type: file.type,
  });
}
