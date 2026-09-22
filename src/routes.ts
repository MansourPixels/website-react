import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/(landing)/index.tsx"),
  // Fora de (auth) e de (private): precisam abrir para quem não tem conta. O
  // Google exige a política acessível sem login para verificar a tela de
  // consentimento, e os termos têm de ser legíveis antes do cadastro.
  route("politica-privacidade", "routes/(landing)/politica-privacidade/index.tsx"),
  route("termos-uso", "routes/(landing)/termos-uso/index.tsx"),
  // Também fora de (auth) e de (private), e por razões opostas: (auth)
  // redirecionaria para o app quem clica no link do e-mail com a sessão aberta,
  // e (private) exigiria login num link que existe para funcionar sem ele.
  // Fora da lista `prerender`: depende do token da query.
  route(
    "notificacoes/descadastrar",
    "routes/(landing)/notificacoes/descadastrar/index.tsx",
  ),
  layout("routes/(auth)/layout.tsx", [
    route("auth/entrar", "routes/(auth)/entrar/index.tsx"),
    route("auth/cadastro", "routes/(auth)/cadastro/index.tsx"),
    route("auth/esqueci-senha", "routes/(auth)/esqueci-senha/index.tsx"),
  ]),
  // Fora do grupo (private): o RequireAuth redirecionaria para o login e
  // descartaria o ?code= se a sessão local tivesse expirado.
  route("spotify/callback", "routes/(spotify)/callback/index.tsx"),
  // Mesma razão do callback do Spotify: o RequireAuth redirecionaria para o
  // login e descartaria o retorno do Google se a sessão local tivesse expirado
  // durante o consentimento.
  route("google/callback", "routes/(google)/callback/index.tsx"),
  // Fora do layout de (private) pela mesma razão dos callbacks acima, e mais
  // uma: é esta rota que o RequireOnboarding manda cumprir, então ela não pode
  // passar pelo próprio gate — seria um laço infinito. A exigência de sessão
  // continua valendo, e o RequireAuth entra dentro da própria rota.
  route("onboarding", "routes/(onboarding)/index.tsx"),
  // Fora de (private) e de (auth): precisa aparecer igual para quem está
  // logado e para quem não está, sem nenhum dos dois redirecionar antes.
  route("*", "routes/(not-found)/index.tsx"),
  layout("routes/(private)/layout.tsx", [
    // Área de administração: o layout próprio aplica o portão do papel `admin`
    // e desenha o menu das seções. Fora da lista `prerender`.
    layout("routes/(private)/admin/layout.tsx", [
      route("admin", "routes/(private)/admin/index.tsx"),
      route("admin/custos", "routes/(private)/admin/custos/index.tsx"),
      route("admin/usuarios", "routes/(private)/admin/usuarios/index.tsx"),
      route("admin/filas", "routes/(private)/admin/filas/index.tsx"),
      route("admin/cotas", "routes/(private)/admin/cotas/index.tsx"),
    ]),
    route("perfil", "routes/(private)/perfil/index.tsx"),
    route("perfil/avatar", "routes/(private)/perfil/avatar/index.tsx"),
    route(
      "perfil/notificacoes",
      "routes/(private)/perfil/notificacoes/index.tsx",
    ),
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
      "pastas/:pastaId/assuntos/:assuntoId/materiais/:contentId",
      "routes/(private)/pastas/$pastaId/assuntos/$assuntoId/materiais/$contentId/index.tsx",
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
    route("amigos", "routes/(private)/amigos/index.tsx"),
    route("usuarios/:username", "routes/(private)/usuarios/$username/index.tsx"),
    route("ranking", "routes/(private)/ranking/index.tsx"),
    route("turmas", "routes/(private)/turmas/index.tsx"),
    // Antes de "turmas/:turmaId": o segmento estático precisa vencer o
    // dinâmico, senão "convite" seria lido como um id de turma.
    route(
      "turmas/convite/:codigo",
      "routes/(private)/turmas/convite/$codigo/index.tsx",
    ),
    route("turmas/:turmaId", "routes/(private)/turmas/$turmaId/index.tsx"),
    route(
      "turmas/:turmaId/membros",
      "routes/(private)/turmas/$turmaId/membros/index.tsx",
    ),
    route(
      "turmas/:turmaId/pastas/:pastaId",
      "routes/(private)/turmas/$turmaId/pastas/$pastaId/index.tsx",
    ),
    route("tarefas", "routes/(private)/tarefas/index.tsx"),
    route(
      "turmas/:turmaId/pastas/:pastaId/materiais/:contentId",
      "routes/(private)/turmas/$turmaId/pastas/$pastaId/materiais/$contentId/index.tsx",
    ),
    route("turmas/:turmaId/pastas/:pastaId/resumo", "routes/(private)/turmas/$turmaId/pastas/$pastaId/resumo/index.tsx"),
    route("turmas/:turmaId/pastas/:pastaId/flash-cards", "routes/(private)/turmas/$turmaId/pastas/$pastaId/flash-cards/index.tsx"),
    route("turmas/:turmaId/pastas/:pastaId/simulado-prova", "routes/(private)/turmas/$turmaId/pastas/$pastaId/simulado-prova/index.tsx"),
    route("turmas/:turmaId/pastas/:pastaId/mapa-mental", "routes/(private)/turmas/$turmaId/pastas/$pastaId/mapa-mental/index.tsx"),
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
