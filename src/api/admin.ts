import type {
  AdminUserPage,
  DeadLetterMessages,
  DeadLetterQueues,
  FailurePage,
  FailureSource,
  TopUsers,
  UsageBreakdown,
  UsageDimension,
  UsageSummary,
  UserUsage,
} from "@/types/api/admin";

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

export function getUsageBreakdown(
  period: AdminPeriod,
  by: UsageDimension,
  signal?: AbortSignal,
): Promise<UsageBreakdown> {
  return adminFetch<UsageBreakdown>(`/api/admin/usage/breakdown${periodQuery(period, { by })}`, { signal });
}

export function getTopUsers(period: AdminPeriod, limit: number, signal?: AbortSignal): Promise<TopUsers> {
  return adminFetch<TopUsers>(`/api/admin/usage/top-users${periodQuery(period, { limit: String(limit) })}`, {
    signal,
  });
}

export function getUserUsage(ownerId: string, period: AdminPeriod, signal?: AbortSignal): Promise<UserUsage> {
  return adminFetch<UserUsage>(
    `/api/admin/usage/users/${encodeURIComponent(ownerId)}${periodQuery(period)}`,
    { signal },
  );
}

export interface AdminUserQuery {
  /** Começo do nome de usuário ou do e-mail; vazio lista todos. */
  query?: string;
  /** Começa em 0. */
  page?: number;
  size?: number;
}

export function listAdminUsers(
  { query, page, size }: AdminUserQuery,
  signal?: AbortSignal,
): Promise<AdminUserPage> {
  const params = new URLSearchParams();

  if (query) params.set("query", query);
  if (page !== undefined) params.set("page", String(page));
  if (size !== undefined) params.set("size", String(size));

  const search = params.toString();

  return adminFetch<AdminUserPage>(`/api/admin/users${search.length === 0 ? "" : `?${search}`}`, { signal });
}

/** Desativa a conta e encerra as sessões dela. `409` para a própria conta. */
export function disableUser(ownerId: string): Promise<void> {
  return adminFetch<void>(`/api/admin/users/${encodeURIComponent(ownerId)}/disable`, { method: "POST" });
}

export function enableUser(ownerId: string): Promise<void> {
  return adminFetch<void>(`/api/admin/users/${encodeURIComponent(ownerId)}/enable`, { method: "POST" });
}

export function listDeadLetterQueues(signal?: AbortSignal): Promise<DeadLetterQueues> {
  return adminFetch<DeadLetterQueues>("/api/admin/dead-letters", { signal });
}

function deadLetterPath(queue: string, action: string, limit?: number): string {
  const query = limit === undefined ? "" : `?limit=${limit}`;

  return `/api/admin/dead-letters/${encodeURIComponent(queue)}/${action}${query}`;
}

/** As primeiras mensagens de uma fila morta, sem tirá-las da fila. */
export function peekDeadLetters(queue: string, limit: number, signal?: AbortSignal): Promise<DeadLetterMessages> {
  return adminFetch<DeadLetterMessages>(deadLetterPath(queue, "messages", limit), { signal });
}

/** Manda as mensagens de volta para a fila de trabalho que falhou; sem `limit`, até 100. */
export function replayDeadLetters(queue: string, limit?: number): Promise<{ replayed: number }> {
  return adminFetch<{ replayed: number }>(deadLetterPath(queue, "replay", limit), { method: "POST" });
}

/** Apaga as mensagens da fila morta; sem `limit`, até 100. Não tem volta. */
export function discardDeadLetters(queue: string, limit?: number): Promise<{ discarded: number }> {
  return adminFetch<{ discarded: number }>(deadLetterPath(queue, "discard", limit), { method: "POST" });
}

export interface FailureQuery {
  /** Sem origem, as duas juntas. */
  source?: FailureSource;
  /** Começa em 0. */
  page?: number;
  size?: number;
}

export function listFailures({ source, page, size }: FailureQuery, signal?: AbortSignal): Promise<FailurePage> {
  const params = new URLSearchParams();

  if (source) params.set("source", source);
  if (page !== undefined) params.set("page", String(page));
  if (size !== undefined) params.set("size", String(size));

  const search = params.toString();

  return adminFetch<FailurePage>(`/api/admin/failures${search.length === 0 ? "" : `?${search}`}`, { signal });
}

// Exportado para os módulos das próximas telas de admin reaproveitarem.
export { adminFetch, periodQuery };
