/**
 * Contratos da API de administração (`/api/admin/**`, papel de realm `admin`).
 * Dinheiro vem em dólar, como foi registrado; `usdBrlRate` é a cotação que o
 * servidor usa para a tela mostrar os dois.
 */
export interface UsageSummary {
  from: string;
  to: string;
  costUsd: number;
  unpricedCalls: number;
  calls: number;
  failedCalls: number;
  inputTokens: number;
  outputTokens: number;
  audioMinutes: number;
  distinctUsers: number;
  usdBrlRate: number;
}

/** As medidas de um grupo de um detalhamento (um dia, uma funcionalidade...). */
export interface UsageGroup {
  /** O dia (`2026-09-01`), a funcionalidade, o modelo, o gatilho, o resultado ou a turma; `null` sem valor. */
  key: string | null;
  costUsd: number;
  unpricedCalls: number;
  calls: number;
  failedCalls: number;
  inputTokens: number;
  outputTokens: number;
  audioMinutes: number;
}

export type UsageDimension = "day" | "feature" | "model" | "trigger" | "outcome" | "classroom";

export interface UsageBreakdown {
  by: UsageDimension;
  from: string;
  to: string;
  groups: UsageGroup[];
}

export interface TopUser {
  ownerId: string;
  /** `null` quando o diretório de usuários não conhece a conta. */
  username: string | null;
  email: string | null;
  costUsd: number;
  calls: number;
  audioMinutes: number;
}

export interface TopUsers {
  from: string;
  to: string;
  users: TopUser[];
  unattributed: { costUsd: number; calls: number; audioMinutes: number };
  usdBrlRate: number;
}

export interface UserUsage {
  ownerId: string;
  summary: UsageSummary;
  byDay: UsageGroup[];
  byFeature: UsageGroup[];
}

/** Uma conta do diretório de usuários, com o estado no Keycloak e o uso dos últimos 30 dias. */
export interface AdminUser {
  ownerId: string;
  username: string;
  email: string | null;
  enabled: boolean;
  costUsd30d: number;
  calls30d: number;
}

/** Uma página da busca de usuários; `page` começa em 0. */
export interface AdminUserPage {
  total: number;
  page: number;
  size: number;
  users: AdminUser[];
  usdBrlRate: number;
}

export interface DeadLetterQueue {
  name: string;
  workQueue: string;
  messages: number;
}

export interface DeadLetterQueues {
  queues: DeadLetterQueue[];
}
