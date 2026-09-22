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

export interface DeadLetterQueue {
  name: string;
  workQueue: string;
  messages: number;
}

export interface DeadLetterQueues {
  queues: DeadLetterQueue[];
}
