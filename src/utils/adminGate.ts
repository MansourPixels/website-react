export type AdminAccessStatus = "loading" | "ready" | "error";
export type AdminGate = "loading" | "allowed" | "denied";

/**
 * Decide o que o portão da área de admin mostra. Uma falha ao descobrir o papel
 * nega o acesso: é só experiência (o backend é quem protege, com `403`), e
 * mostrar a área sem saber se a pessoa é admin só levaria a erros em todas as
 * chamadas.
 */
export function adminGate(status: AdminAccessStatus, isAdmin: boolean): AdminGate {
  if (status === "loading") return "loading";

  return status === "ready" && isAdmin ? "allowed" : "denied";
}
