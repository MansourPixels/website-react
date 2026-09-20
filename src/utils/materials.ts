import type { ClassroomContentKind } from "@/types/api/classroom";
import type { ContentType } from "@/types/api/content";

export const ACCEPTED_MATERIAL_TYPES = "image/*,application/pdf";

export function isAcceptedMaterial(file: File | Blob) {
  return file.type.startsWith("image/") || file.type === "application/pdf";
}

export function contentTypeOf(file: File | Blob): ContentType {
  if (file.type === "application/pdf") return "PDF";
  if (file.type.startsWith("video/") || (file instanceof File && isVideoFileName(file.name))) {
    return "VIDEO";
  }
  if (file.type.startsWith("audio/") || (file instanceof File && isAudioFileName(file.name))) {
    return "AUDIO";
  }

  return "IMAGE";
}

export function contentTypeLabel(contentType: ContentType) {
  if (contentType === "AUDIO") return "áudio";
  if (contentType === "VIDEO") return "vídeo";

  return contentType === "PDF" ? "PDF" : "imagem";
}

/**
 * Áudio e vídeo seguem o mesmo caminho: transcritos, com status, momentos e artefatos.
 * Todo teste "é mídia?" passa por aqui, para o próximo tipo de mídia não pedir uma caça
 * a `=== "AUDIO"` pelo código.
 */
export function isMediaType(contentType: ContentType | null | undefined): boolean {
  return contentType === "AUDIO" || contentType === "VIDEO";
}

/** O substantivo de uma mídia nos textos da tela; os dois são masculinos, então "o/do/este" servem aos dois. */
export function mediaNoun(contentType: ContentType | null | undefined): "áudio" | "vídeo" {
  return contentType === "VIDEO" ? "vídeo" : "áudio";
}

/** Extensões que o backend aceita para áudio (a validação final é dele). */
export const AUDIO_EXTENSIONS = ["mp3", "m4a", "wav", "ogg", "flac"] as const;

/** Extensões que o backend aceita para vídeo; só a faixa de áudio é transcrita. */
export const VIDEO_EXTENSIONS = ["mp4", "mov", "mkv", "webm"] as const;

/** Para o `accept` do seletor de arquivos: extensões, já que o `type` varia por sistema. */
export const AUDIO_ACCEPT = AUDIO_EXTENSIONS.map((ext) => `.${ext}`).join(",");
export const VIDEO_ACCEPT = VIDEO_EXTENSIONS.map((ext) => `.${ext}`).join(",");
export const MEDIA_ACCEPT = `${AUDIO_ACCEPT},${VIDEO_ACCEPT}`;

/** Espelha `MEDIA_MAX_AUDIO_SIZE` do backend (200 MB por padrão). */
export const MAX_AUDIO_BYTES = 200 * 1024 * 1024;

/** Espelha `MEDIA_MAX_VIDEO_SIZE` do backend (1 GB por padrão). */
export const MAX_VIDEO_BYTES = 1024 * 1024 * 1024;

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

export function isVideoFileName(fileName: string): boolean {
  return (VIDEO_EXTENSIONS as readonly string[]).includes(extensionOf(fileName));
}

export function isVideoFile(file: File): boolean {
  return isVideoFileName(file.name);
}

export function isMediaFile(file: File): boolean {
  return isAudioFile(file) || isVideoFile(file);
}

/** O limite de tamanho do backend para um arquivo de mídia: o do vídeo é maior que o do áudio. */
export function mediaLimitFor(file: File): number {
  return isVideoFile(file) ? MAX_VIDEO_BYTES : MAX_AUDIO_BYTES;
}

/**
 * Por que este arquivo não pode ser enviado como áudio ou vídeo, ou `null` se pode.
 *
 * O tamanho é conferido aqui de propósito: um arquivo muito acima do limite não
 * recebe `413` do servidor (ele fecha a conexão no meio do envio), então o
 * usuário só veria um erro de rede sem explicação.
 */
export function mediaProblem(file: File): string | null {
  if (!isMediaFile(file)) {
    return "Envie um áudio (.mp3, .m4a, .wav, .ogg ou .flac) ou um vídeo (.mp4, .mov, .mkv ou .webm).";
  }
  if (file.size === 0) return "O arquivo está vazio.";

  const limit = mediaLimitFor(file);

  if (file.size > limit) {
    return `O ${isVideoFile(file) ? "vídeo" : "áudio"} tem ${formatFileSize(file.size)} e o limite é ${formatFileSize(limit)}.`;
  }

  return null;
}

type ClassroomUploadKind = Extract<ClassroomContentKind, "pdf" | "image" | "audio" | "video">;

/**
 * O `kind` de um arquivo enviado a uma pasta de turma, ou `null` se a extensão
 * não é de PDF, imagem, áudio ou vídeo. O backend confere a extensão contra o kind.
 */
export function classroomKindForFileName(fileName: string): ClassroomUploadKind | null {
  const extension = extensionOf(fileName);

  if (extension === "pdf") return "pdf";
  if (extension === "jpg" || extension === "jpeg" || extension === "png") {
    return "image";
  }
  if (isAudioFileName(fileName)) return "audio";
  if (isVideoFileName(fileName)) return "video";

  return null;
}

/** O limite de tamanho do backend para o tipo de arquivo de turma. */
export function classroomLimitFor(kind: ClassroomUploadKind): number {
  if (kind === "video") return MAX_VIDEO_BYTES;

  return kind === "audio" ? MAX_AUDIO_BYTES : MAX_DOCUMENT_BYTES;
}

function trimmed(value: number): string {
  return value.toFixed(1).replace(".", ",").replace(/,0$/, "");
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;

  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) return `${Math.round(kilobytes)} KB`;

  // "200 MB", não "200,0 MB": os limites de envio são números redondos.
  const megabytes = kilobytes / 1024;
  if (megabytes < 1024) return `${trimmed(megabytes)} MB`;

  return `${trimmed(megabytes / 1024)} GB`;
}

// Fotos da câmera chegam como Blob sem nome/extensão, e o back valida a
// extensão do arquivo (não só o Content-Type) contra o contentType
// declarado — garante um nome com a extensão certa antes do upload.
export function ensureUploadFilename(
  file: File | Blob,
  contentType: ContentType,
): File {
  // Áudio e vídeo nunca saem da captura: o arquivo escolhido já tem nome e extensão.
  if (isMediaType(contentType)) {
    const extension = contentType === "VIDEO" ? "mp4" : "mp3";

    return file instanceof File
      ? file
      : new File([file], `${mediaNoun(contentType) === "vídeo" ? "video" : "audio"}-${Date.now()}.${extension}`, { type: file.type });
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
