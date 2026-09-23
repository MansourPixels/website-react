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

export interface DeadLetterQueue {
  name: string;
  workQueue: string;
  messages: number;
}

export interface DeadLetterQueues {
  queues: DeadLetterQueue[];
}
