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

/** O que o Picker devolve, e o bastante para baixar o arquivo. */
export interface DriveFileRef {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number | null;
}

export interface CalendarEventInput {
  taskId: string;
  title: string;
  motherFolderName: string;
  childFolderName: string | null;
  /** ISO. Vira o início do evento; o fim é 30 minutos depois. */
  dueAt: string;
  done: boolean;
}
