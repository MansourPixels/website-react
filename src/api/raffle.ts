import type {
  RaffleEntries,
  RaffleEntry,
  RaffleStatus,
} from "@/types/api/raffle";

import { ApiError, apiFetch } from "./client";

export function getRaffleStatus(signal?: AbortSignal): Promise<RaffleStatus> {
  return apiFetch<RaffleStatus>("/api/raffle/me", { signal });
}

/**
 * Entra no sorteio. Nome e e-mail não viajam: o servidor os lê do token. É
 * idempotente — quem já entrou recebe `200` com a mesma resposta.
 */
export function registerForRaffle(): Promise<RaffleStatus> {
  return apiFetch<RaffleStatus>("/api/raffle/registrations", {
    method: "POST",
    body: { consent: true },
  });
}

/**
 * Pergunta ao servidor se a pessoa tem a role `sorteio`, em vez de decodificar
 * o token no navegador. `403` é a resposta "não"; qualquer outra falha
 * (rede, 5xx) continua sendo erro, para não esconder a tela de quem tem acesso.
 */
export async function probeRaffleAdmin(signal?: AbortSignal): Promise<boolean> {
  try {
    await apiFetch<void>("/api/raffle/admin/me", { signal });

    return true;
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) return false;

    throw error;
  }
}

export function listRaffleEntries(signal?: AbortSignal): Promise<RaffleEntries> {
  return apiFetch<RaffleEntries>("/api/raffle/admin/entries", { signal });
}

export function drawRaffleWinner(): Promise<RaffleEntry> {
  return apiFetch<RaffleEntry>("/api/raffle/admin/draw", { method: "POST" });
}
