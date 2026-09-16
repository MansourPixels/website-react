import type { GoogleIssue } from "@/types/Google";

/**
 * Traduz o motivo técnico em algo acionável, num lugar só — o mesmo texto
 * aparece no cartão do Perfil, na câmera e na lista de tarefas.
 *
 * Um escopo desmarcado no consentimento não pode virar "algo deu errado": o
 * aluno precisa saber que falta uma permissão e o que fazer a respeito.
 */
export function googleIssueMessage(issue: GoogleIssue): string | null {
  switch (issue) {
    case "popupBlocked":
      return "O navegador bloqueou a janela do Google. Libere pop-ups para este site e tente de novo.";
    case "consentDenied":
      return "A conexão com o Google não foi autorizada. Conecte de novo para continuar.";
    case "scopeMissing":
      return "Falta uma permissão no consentimento do Google. Conecte de novo e mantenha as caixas marcadas.";
    case "rateLimited":
      return "O Google recusou temporariamente novos pedidos. Tente de novo em alguns instantes.";
    case "requestFailed":
      return "Não foi possível falar com o Google. Tente de novo.";
    default:
      return null;
  }
}
