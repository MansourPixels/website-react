export const NEXT_ROUTE_PARAM = "proximo";

const DEFAULT_ROUTE = "/capturar";

export function buildSignInPath(pathname: string, search: string) {
  const target = `${pathname}${search}`;

  if (target === "/" || target.length === 0) return "/auth/entrar";

  return `/auth/entrar?${NEXT_ROUTE_PARAM}=${encodeURIComponent(target)}`;
}

export function resolveNextRoute(value: string | null) {
  if (value === null) return DEFAULT_ROUTE;
  if (!value.startsWith("/") || value.startsWith("//")) return DEFAULT_ROUTE;

  return value;
}
