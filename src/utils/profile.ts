/**
 * Rota do perfil público. Mora num lugar só porque é referenciada de mais de
 * dez telas — mudar a forma da URL não pode virar uma caça a `Link`s.
 */
export function profilePath(username: string): string {
  return `/usuarios/${encodeURIComponent(username)}`;
}
