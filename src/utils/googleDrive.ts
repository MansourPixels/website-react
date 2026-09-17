// Documento, apresentação e planilha do Google não têm bytes para baixar: só
// existem exportados. Quem faz a exportação (em PDF) é o servidor, no
// `POST /api/contents/from-drive` — aqui a lista existe só para o Picker não
// oferecer ao aluno um arquivo que a importação depois recusaria.
const NATIVE_TYPES = [
  "application/vnd.google-apps.document",
  "application/vnd.google-apps.presentation",
  "application/vnd.google-apps.spreadsheet",
];

/** O filtro do Picker. O servidor revalida — esconder não é validar. */
export const DRIVE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  ...NATIVE_TYPES,
].join(",");
