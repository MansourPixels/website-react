/** Resposta de `GET /api/raffle/me` e de `POST /api/raffle/registrations`. */
export interface RaffleStatus {
  registered: boolean;
  /** ISO-8601; nulo enquanto a pessoa não entrou. */
  registeredAt: string | null;
}

export interface RaffleEntry {
  id: string;
  displayName: string;
  /** Nulo quando a conta não tem e-mail verificado. */
  email: string | null;
  /** Sem o "@" inicial. Nulo para quem entrou sem informar. */
  instagram: string | null;
  registeredAt: string;
  drawn: boolean;
  drawnAt: string | null;
}

export interface RaffleEntries {
  total: number;
  entries: RaffleEntry[];
}
