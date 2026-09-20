import type { ClassroomContentKind } from "@/types/api/classroom";
import type { ContentType } from "@/types/api/content";

export const ACCEPTED_MATERIAL_TYPES = "image/*,application/pdf";

export function isAcceptedMaterial(file: File | Blob) {
  return file.type.startsWith("image/") || file.type === "application/pdf";
}

export function contentTypeOf(file: File | Blob): ContentType {
  return file.type === "application/pdf" ? "PDF" : "IMAGE";
}

export function contentTypeLabel(contentType: ContentType) {
  if (contentType === "AUDIO") return "áudio";

  return contentType === "PDF" ? "PDF" : "imagem";
}

/** Extensões que o backend aceita para áudio (a validação final é dele). */
export const AUDIO_EXTENSIONS = ["mp3", "m4a", "wav", "ogg", "flac"] as const;

/** Para o `accept` do seletor de arquivos: extensões, já que o `type` varia por sistema. */
export const AUDIO_ACCEPT = AUDIO_EXTENSIONS.map((ext) => `.${ext}`).join(",");

/** Espelha `MEDIA_MAX_AUDIO_SIZE` do backend (200 MB por padrão). */
export const MAX_AUDIO_BYTES = 200 * 1024 * 1024;

/** Espelha `CONTENT_MAX_FILE_SIZE` do backend (20 MB por padrão) para PDF e imagem. */
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");

  return dot < 0 ? "" : fileName.slice(dot + 1).toLowerCase();
}

export function isAudioFileName(fileName: string): boolean {
  return (AUDIO_EXTENSIONS as readonly string[]).includes(extensionOf(fileName));
}

export function isAudioFile(file: File): boolean {
  return isAudioFileName(file.name);
}

/**
 * Por que este arquivo não pode ser enviado como áudio, ou `null` se pode.
 *
 * O tamanho é conferido aqui de propósito: um arquivo muito acima do limite não
 * recebe `413` do servidor (ele fecha a conexão no meio do envio), então o
 * usuário só veria um erro de rede sem explicação.
 */
export function audioProblem(file: File): string | null {
  if (!isAudioFile(file)) {
    return "Envie um arquivo de áudio: .mp3, .m4a, .wav, .ogg ou .flac.";
  }
  if (file.size === 0) return "O arquivo está vazio.";
  if (file.size > MAX_AUDIO_BYTES) {
    return `O áudio tem ${formatFileSize(file.size)} e o limite é ${formatFileSize(MAX_AUDIO_BYTES)}.`;
  }

  return null;
}

/**
 * O `kind` de um arquivo enviado a uma pasta de turma, ou `null` se a extensão
 * não é de PDF, imagem ou áudio. O backend confere a extensão contra o kind.
 */
export function classroomKindForFileName(
  fileName: string,
): Extract<ClassroomContentKind, "pdf" | "image" | "audio"> | null {
  const extension = extensionOf(fileName);

  if (extension === "pdf") return "pdf";
  if (extension === "jpg" || extension === "jpeg" || extension === "png") {
    return "image";
  }
  if (isAudioFileName(fileName)) return "audio";

  return null;
}

/** O limite de tamanho do backend para o tipo de arquivo de turma. */
export function classroomLimitFor(
  kind: Extract<ClassroomContentKind, "pdf" | "image" | "audio">,
): number {
  return kind === "audio" ? MAX_AUDIO_BYTES : MAX_DOCUMENT_BYTES;
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
  // Áudio nunca sai da captura: o arquivo escolhido já tem nome e extensão.
  if (contentType === "AUDIO") {
    return file instanceof File
      ? file
      : new File([file], `audio-${Date.now()}.mp3`, { type: file.type });
  }

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
