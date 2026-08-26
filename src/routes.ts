import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  route("ascensao", "routes/ascensao/index.tsx"),
  route("capturar", "routes/capturar/index.tsx"),
  route("pastas", "routes/pastas/index.tsx"),
  route("pastas/:pastaId", "routes/pastas/$pastaId/index.tsx"),
  route(
    "pastas/:pastaId/assuntos/:assuntoId",
    "routes/pastas/$pastaId/assuntos/$assuntoId/index.tsx",
  ),
  route(
    "pastas/:pastaId/assuntos/:assuntoId/camera",
    "routes/pastas/$pastaId/assuntos/$assuntoId/camera/index.tsx",
  ),
  route(
    "pastas/:pastaId/assuntos/:assuntoId/flash-cards",
    "routes/pastas/$pastaId/assuntos/$assuntoId/flash-cards/index.tsx",
  ),
  route(
    "pastas/:pastaId/assuntos/:assuntoId/resumo",
    "routes/pastas/$pastaId/assuntos/$assuntoId/resumo/index.tsx",
  ),
  route(
    "pastas/:pastaId/assuntos/:assuntoId/simulado-prova",
    "routes/pastas/$pastaId/assuntos/$assuntoId/simulado-prova/index.tsx",
  ),
  route("trilha", "routes/trilha/index.tsx"),
  route("trilha/plano/:planoId", "routes/trilha/plano/$planoId/index.tsx"),
  route(
    "trilha/plano/:planoId/etapa/:etapaId",
    "routes/trilha/plano/$planoId/etapa/$etapaId.tsx",
  ),
] satisfies RouteConfig;
