import type { DriveFileRef } from "@/types/Google";

import {
  GoogleError,
  ensureAccessToken,
  issueForStatus,
} from "./googleAuth";
import { contentTypeOf, ensureUploadFilename, isAcceptedMaterial } from "./materials";

const DRIVE_API = "https://www.googleapis.com/drive/v3/files";

// Documento, apresentação e planilha do Google não têm bytes para baixar: só
// existem exportados. PDF é o formato que o resto do Revi já sabe ler.
const NATIVE_EXPORTS: Record<string, string> = {
  "application/vnd.google-apps.document": "application/pdf",
  "application/vnd.google-apps.presentation": "application/pdf",
  "application/vnd.google-apps.spreadsheet": "application/pdf",
};

/** O filtro que o Picker aplica — a recusa abaixo é a rede de segurança. */
export const DRIVE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  ...Object.keys(NATIVE_EXPORTS),
].join(",");

/** O arquivo veio, mas não é imagem nem PDF. Carrega o nome para a mensagem. */
export class DriveFileTypeError extends Error {
  fileName: string;

  constructor(fileName: string) {
    super(`Tipo não aceito: ${fileName}`);
    this.name = "DriveFileTypeError";
    this.fileName = fileName;
  }
}

function withPdfExtension(name: string) {
  return /\.pdf$/i.test(name) ? name : `${name.replace(/\.[^.]+$/, "")}.pdf`;
}

/**
 * Baixa o arquivo escolhido no Picker e entrega um `File` pronto para o mesmo
 * `uploadContent` que a câmera usa. Nome e Content-Type passam por
 * `contentTypeOf`/`ensureUploadFilename` — as regras do upload já moram lá.
 */
export async function downloadDriveFile(
  ref: DriveFileRef,
  signal?: AbortSignal,
): Promise<File> {
  const token = await ensureAccessToken();

  if (token === null) throw new GoogleError("consentDenied");

  const exportType = NATIVE_EXPORTS[ref.mimeType];
  const url =
    exportType === undefined
      ? `${DRIVE_API}/${ref.id}?alt=media&supportsAllDrives=true`
      : `${DRIVE_API}/${ref.id}/export?mimeType=${encodeURIComponent(exportType)}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });

  if (!response.ok) throw new GoogleError(issueForStatus(response.status));

  const blob = await response.blob();
  const type = exportType ?? (blob.type.length > 0 ? blob.type : ref.mimeType);
  const name = exportType === undefined ? ref.name : withPdfExtension(ref.name);

  const file = new File([blob], name, { type });

  if (!isAcceptedMaterial(file)) throw new DriveFileTypeError(ref.name);

  return ensureUploadFilename(file, contentTypeOf(file));
}
