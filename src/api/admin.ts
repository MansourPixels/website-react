import type { DeadLetterQueues, UsageSummary } from "@/types/api/admin";

import { apiFetch, ApiError } from "./client";

/**
 * Disparado quando uma rota de admin responde `403`: o papel `admin` foi tirado
 * da conta (o token antigo ainda chega até expirar). O layout da área escuta
 * este evento e troca a página por "Acesso restrito", sem precisar que cada
 * tela trate o erro.
 */
export const ADMIN_FORBIDDEN_EVENT = "revi:admin-forbidden";

/** Um `403` de uma rota de admin: quem chamou não tem (mais) o papel `admin`. */
export class AdminForbiddenError extends Error {
  constructor() {
    super("Acesso restrito à administração.");
    this.name = "AdminForbiddenError";
  }
}

type AdminRequest = Parameters<typeof apiFetch>[1];

async function adminFetch<T>(path: string, options?: AdminRequest): Promise<T> {
  try {
    return await apiFetch<T>(path, options);
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(ADMIN_FORBIDDEN_EVENT));
      }
      throw new AdminForbiddenError();
    }
    throw error;
  }
}

/** Datas no fuso de São Paulo (`2026-09-01`); `to` inclui o dia inteiro. Sem elas, os últimos 30 dias. */
export interface AdminPeriod {
  from?: string;
  to?: string;
}

function periodQuery(period: AdminPeriod, extra: Record<string, string> = {}): string {
  const params = new URLSearchParams();

  if (period.from) params.set("from", period.from);
  if (period.to) params.set("to", period.to);
  for (const [key, value] of Object.entries(extra)) params.set(key, value);

  const query = params.toString();

  return query.length === 0 ? "" : `?${query}`;
}

export function getUsageSummary(
  period: AdminPeriod = {},
  signal?: AbortSignal,
): Promise<UsageSummary> {
  return adminFetch<UsageSummary>(`/api/admin/usage/summary${periodQuery(period)}`, {
    signal,
  });
}

export function listDeadLetterQueues(signal?: AbortSignal): Promise<DeadLetterQueues> {
  return adminFetch<DeadLetterQueues>("/api/admin/dead-letters", { signal });
}

// Exportado para os módulos das próximas telas de admin reaproveitarem.
export { adminFetch, periodQuery };
