import type { AdminUser, AdminUserPage } from "@/types/api/admin";

/** A página com a conta `ownerId` no estado `enabled`; as outras contas e a página ficam como estão. */
export function applyEnabled(page: AdminUserPage, ownerId: string, enabled: boolean): AdminUserPage {
  if (!page.users.some((user) => user.ownerId === ownerId)) return page;

  return {
    ...page,
    users: page.users.map((user) => (user.ownerId === ownerId ? { ...user, enabled } : user)),
  };
}

/** Os usuários da página, do mais caro nos últimos 30 dias ao mais barato; empate por nome. */
export function sortByCost(users: AdminUser[]): AdminUser[] {
  return [...users].sort(
    (a, b) => b.costUsd30d - a.costUsd30d || a.username.localeCompare(b.username, "pt-BR"),
  );
}

export interface UserSearch {
  query: string;
  /** Começa em 1, como na URL (`?pagina=2`). */
  page: number;
}

/** Lê `?busca=` e `?pagina=` da URL; uma página inválida vira a primeira. */
export function userSearchFromUrl(params: URLSearchParams): UserSearch {
  const page = Number(params.get("pagina"));

  return {
    query: (params.get("busca") ?? "").trim(),
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  };
}

/** A URL de uma busca, sem os valores padrão (busca vazia, página 1). */
export function userSearchToUrl({ query, page }: UserSearch): URLSearchParams {
  const params = new URLSearchParams();
  const trimmed = query.trim();

  if (trimmed.length > 0) params.set("busca", trimmed);
  if (page > 1) params.set("pagina", String(page));

  return params;
}

/** Quantas páginas cabem `total` resultados de `size` em `size`; ao menos uma. */
export function pageCount(total: number, size: number): number {
  return Math.max(1, Math.ceil(total / size));
}
