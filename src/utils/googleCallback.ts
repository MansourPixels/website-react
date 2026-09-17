const errorMessages: Record<string, string> = {
  access_denied: "Você cancelou a conexão com o Google.",
  invalid_state: "Não foi possível confirmar a conexão com o Google. Tente novamente.",
  no_refresh_token: "O Google não concedeu acesso contínuo. Tente conectar novamente.",
};

export function googleCallbackErrorMessage(error: string | null): string | null {
  if (error === null) return null;

  return errorMessages[error] ?? "Não foi possível concluir a conexão com o Google.";
}
