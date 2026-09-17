export type GoogleStatus =
  | "loading"
  | "connecting"
  | "connected"
  | "disconnected";

export type GoogleIssue =
  | null
  | "popupBlocked"
  | "consentDenied"
  | "scopeMissing"
  | "rateLimited"
  | "requestFailed";

export interface GoogleToken {
  accessToken: string;
  /** Epoch em milissegundos. */
  expiresAt: number;
  // Escopos *realmente* concedidos, separados por espaço. A tela de
  // consentimento do Google deixa desmarcar um a um, então o que foi pedido e
  // o que voltou nem sempre coincidem — é daqui que saem `hasDrive`/`hasCalendar`.
  scope: string;
}

/** O que o Picker devolve. O `id` é o que o servidor usa para buscar o arquivo. */
export interface DriveFileRef {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number | null;
}
