import { ApiError } from "@/api/client";
import type {
  NotificationCategoryKey,
  NotificationPreferences,
} from "@/types/api/notifications";

/** A ordem em que os interruptores aparecem na tela. */
export const CATEGORY_KEYS: readonly NotificationCategoryKey[] = [
  "friends",
  "classrooms",
  "tasks",
  "reminders",
];

export const CATEGORY_COPY: Record<
  NotificationCategoryKey,
  { label: string; description: string }
> = {
  friends: {
    label: "Amizades",
    description: "Pedidos de amizade recebidos e aceitos.",
  },
  classrooms: {
    label: "Turmas",
    description: "Convites para turmas e quando alguém entra na sua turma.",
  },
  tasks: {
    label: "Tarefas",
    description: "Novas tarefas criadas nas suas turmas.",
  },
  reminders: {
    label: "Lembretes de prazo",
    description: "Um aviso quando o prazo de uma tarefa se aproxima.",
  },
};

/** Devolve uma cópia com a chave trocada; o original e as outras ficam como estão. */
export function withChange(
  preferences: NotificationPreferences,
  key: NotificationCategoryKey,
  value: boolean,
): NotificationPreferences {
  return { ...preferences, [key]: value };
}

export type UnsubscribeOutcome = "invalid-link" | "rate-limited" | "network";

/**
 * Traduz a falha do descadastro no estado da tela. A mensagem é escolhida pelo
 * status e nunca pelo `detail`: o do `400` vem em inglês e é fixo de propósito,
 * para não revelar por que o token falhou. Qualquer erro que não seja `400`
 * nem `429` (rede fora do ar, `5xx`, resposta inesperada) cai em `"network"`.
 */
export function unsubscribeOutcomeFor(error: unknown): UnsubscribeOutcome {
  if (error instanceof ApiError) {
    if (error.status === 400) return "invalid-link";
    if (error.status === 429) return "rate-limited";
  }

  return "network";
}
