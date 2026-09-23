import { ApiError } from "@/api/client";

/** A mensagem de uma ação sobre uma conta (desativar, reativar) que falhou, pelo status da resposta. */
export function accountActionError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) return "Você não pode desativar a sua própria conta.";
    if (error.status === 404) return "Esta conta não existe mais.";
    if (error.status === 503) return "O serviço de contas está fora do ar. Tente de novo em instantes.";
  }

  return "Não foi possível concluir agora.";
}

/**
 * A mensagem de um bloco de admin que não carregou. O `detail` do servidor vem em
 * inglês, então só o status decide: `503` é um serviço fora do ar, o resto usa a
 * mensagem do bloco.
 */
export function adminLoadError(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.status === 503) {
    return "Um serviço do servidor está fora do ar. Tente de novo em instantes.";
  }

  return fallback;
}

/** A mensagem de um reenvio ou descarte de fila morta que falhou, pelo status da resposta. */
export function deadLetterActionError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return "Esta fila não existe mais.";
    if (error.status === 503) return "O RabbitMQ está fora do ar. Tente de novo em instantes.";
  }

  return "Não foi possível concluir agora.";
}
