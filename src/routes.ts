import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/(landing)/index.tsx"),
  layout("routes/(auth)/layout.tsx", [
    route("auth/entrar", "routes/(auth)/entrar/index.tsx"),
    route("auth/cadastro", "routes/(auth)/cadastro/index.tsx"),
    route("auth/esqueci-senha", "routes/(auth)/esqueci-senha/index.tsx"),
  ]),
  // Fora do grupo (private): o RequireAuth redirecionaria para o login e
  // descartaria o ?code= se a sessão local tivesse expirado.
  route("spotify/callback", "routes/(spotify)/callback/index.tsx"),
  // Fora de (private) e de (auth): precisa aparecer igual para quem está
  // logado e para quem não está, sem nenhum dos dois redirecionar antes.
  route("*", "routes/(not-found)/index.tsx"),
  layout("routes/(private)/layout.tsx", [
    route("perfil", "routes/(private)/perfil/index.tsx"),
    route("perfil/avatar", "routes/(private)/perfil/avatar/index.tsx"),
    route("ascensao", "routes/(private)/ascensao/index.tsx"),
    route("sessao", "routes/(private)/sessao/index.tsx"),
    route("capturar", "routes/(private)/capturar/index.tsx"),
    route("pastas", "routes/(private)/pastas/index.tsx"),
    route("pastas/:pastaId", "routes/(private)/pastas/$pastaId/index.tsx"),
    route(
      "pastas/:pastaId/assuntos/:assuntoId",
      "routes/(private)/pastas/$pastaId/assuntos/$assuntoId/index.tsx",
    ),
    route(
      "pastas/:pastaId/assuntos/:assuntoId/camera",
      "routes/(private)/pastas/$pastaId/assuntos/$assuntoId/camera/index.tsx",
    ),
    route(
      "pastas/:pastaId/assuntos/:assuntoId/flash-cards",
      "routes/(private)/pastas/$pastaId/assuntos/$assuntoId/flash-cards/index.tsx",
    ),
    route(
      "pastas/:pastaId/assuntos/:assuntoId/resumo",
      "routes/(private)/pastas/$pastaId/assuntos/$assuntoId/resumo/index.tsx",
    ),
    route(
      "pastas/:pastaId/assuntos/:assuntoId/simulado-prova",
      "routes/(private)/pastas/$pastaId/assuntos/$assuntoId/simulado-prova/index.tsx",
    ),
    route(
      "pastas/:pastaId/assuntos/:assuntoId/mapa-mental",
      "routes/(private)/pastas/$pastaId/assuntos/$assuntoId/mapa-mental/index.tsx",
    ),
    route("trilha", "routes/(private)/trilha/index.tsx"),
    route(
      "trilha/plano/:planoId",
      "routes/(private)/trilha/plano/$planoId/index.tsx",
    ),
    route(
      "trilha/plano/:planoId/etapa/:etapaId",
      "routes/(private)/trilha/plano/$planoId/etapa/$etapaId.tsx",
    ),
  ]),
] satisfies RouteConfig;
