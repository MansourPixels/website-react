import type { DriveFileRef } from "@/types/Google";

import { GoogleError, getApiKey, getAppId } from "./googleAuth";
import { DRIVE_MIME_TYPES } from "./googleDrive";
import { loadPicker } from "./googleScripts";

function toRef(document: GooglePickerDocument): DriveFileRef {
  const size = Number(document.sizeBytes);

  return {
    id: document.id,
    name: document.name ?? "Arquivo do Drive",
    mimeType: document.mimeType ?? "",
    sizeBytes: Number.isFinite(size) && size > 0 ? size : null,
  };
}

/**
 * Abre o seletor de arquivos do Google. Resolve com o arquivo escolhido ou com
 * `null` quando o aluno fecha sem escolher — desistir não é erro.
 */
export async function openDrivePicker(
  accessToken: string,
): Promise<DriveFileRef | null> {
  const apiKey = getApiKey();

  if (apiKey === null) throw new GoogleError("requestFailed");

  await loadPicker();

  return new Promise<DriveFileRef | null>((resolve) => {
    const view = new google.picker.DocsView()
      .setMimeTypes(DRIVE_MIME_TYPES)
      .setIncludeFolders(true)
      .setSelectFolderEnabled(false);

    let builder = new google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(accessToken)
      .setDeveloperKey(apiKey)
      .setLocale("pt-BR")
      .setTitle("Escolher material do Drive");

    const appId = getAppId();

    if (appId !== null) builder = builder.setAppId(appId);

    const picker = builder
      .setCallback((response) => {
        if (response.action === "picked") {
          const [document] = response.docs ?? [];

          picker.dispose();
          resolve(document === undefined ? null : toRef(document));

          return;
        }

        if (response.action === "cancel") {
          picker.dispose();
          resolve(null);
        }
      })
      .build();

    picker.setVisible(true);
  });
}
