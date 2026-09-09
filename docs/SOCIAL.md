# Amigos, Ranking e Turmas — camada social (mockada)

Documentação da implementação **somente frontend, com dados falsos**, das três
áreas sociais do Revi. Nada aqui fala com o `revi_back`: o objetivo é ter os
fluxos navegáveis para validação, e uma troca barata pelo backend real depois.

> **Como trocar pelo backend real**
> Os arquivos `src/api/friends.ts`, `src/api/ranking.ts` e
> `src/api/classrooms.ts` já têm a forma definitiva: funções tipadas que
> devolvem `Promise` e lançam o `ApiError` de `src/api/client.ts`. Cada corpo é
> uma chamada a `mockRequest(...)`. Trocar significa substituir essa linha por
> `apiFetch(...)` e apagar `src/api/mockBackend.ts`,
> `src/utils/socialStorage.ts` e `src/mocks/social/`. Nenhuma tela muda.

---

## 1. O que foi implementado

### Telas

| Rota | Arquivo | O que faz |
| --- | --- | --- |
| `/turmas` | `src/routes/(private)/turmas/index.tsx` | Hub da área social: atalhos para Amigos e Ranking, convites de turma pendentes, entrada por código, grade das turmas do usuário, criação via FAB e botão de restaurar a demonstração. |
| `/turmas/:turmaId` | `.../turmas/$turmaId/index.tsx` | Detalhe da turma: identidade, papel do usuário, acesso a membros, convite (só dono), grade de pastas, editar/excluir turma ou sair dela. |
| `/turmas/:turmaId/pastas/:pastaId` | `.../$turmaId/pastas/$pastaId/index.tsx` | Conteúdo da pasta, com menu por item montado a partir das permissões. FAB de adicionar só para dono e editor. |
| `/turmas/:turmaId/membros` | `.../$turmaId/membros/index.tsx` | Lista de membros. O dono altera permissão, remove membros e revoga convites; os demais veem só leitura. |
| `/turmas/convite/:codigo` | `.../turmas/convite/$codigo/index.tsx` | Prévia de um convite aberto por link/código, com aceitar e recusar, e estados de erro por código inválido, revogado, expirado, de outra pessoa ou já membro. |
| `/amigos` | `src/routes/(private)/amigos/index.tsx` | Busca por username com debounce, envio de solicitação, abas de amigos e solicitações (recebidas e enviadas), remoção de amizade. |
| `/ranking` | `src/routes/(private)/ranking/index.tsx` | Ranking em três escopos, resumo da temporada, contagem para o reset, campeão do mês anterior e paginação por "Carregar mais". |
| `/usuarios/:username` | `src/routes/(private)/usuarios/$username/index.tsx` | Perfil público de outro usuário: avatar, XP e posição global, flash cards e simulados, turmas em comum, amigos em comum e a ação de amizade. |

### Navegação

- `src/root.tsx` ganhou uma 6ª aba **Turmas** (`Users`), entre Trilha e Perfil.
- `/amigos` e `/ranking` entraram em `extraBottomNavigationRoutes`: mantêm a
  barra inferior visível, mas não são abas — chega-se a elas pelo hub de Turmas
  ou pelo Perfil.
- `src/routes/(private)/perfil/index.tsx` ganhou duas linhas de navegação
  (Amigos e Ranking), no mesmo padrão da linha de Ascensão que já existia.
- **Todo usuário exibido é clicável** e leva a `/usuarios/:username`. São os sete
  cards que usam `UserIdentity` (ranking, campeão, amigos, solicitações, busca,
  membros e a prévia de convite) mais quatro `@username` soltos: dono da turma,
  quem convidou, o destinatário de um convite nominal e o autor de um conteúdo.
  A rota sai de `profilePath` (`src/utils/profile.ts`), para a forma da URL viver
  num lugar só.
- **Diálogos de confirmação ficam de fora de propósito**
  (`DialogFriendRemoval`, `DialogContentExclusion`): tirar a pessoa da tela no
  meio de um "tem certeza?" é armadilha.
- `/usuarios/:username` **não** exibe a barra inferior, como as outras telas de
  profundidade — `extraBottomNavigationRoutes` compara `pathname` por igualdade.

### Componentes

| Componente | Arquivo | Papel |
| --- | --- | --- |
| `UserIdentity` | `src/components/UserIdentity.tsx` | Avatar + nome + `@username` + legenda. Compartilhado por busca, amigos, ranking, membros e convites. Com `linkToProfile`, a raiz vira um `Link` para o perfil público. |
| `FriendshipAction` | `.../usuarios/$username/components/` | O botão de amizade do perfil, com uma ação por estado da relação (adicionar, cancelar, aceitar/recusar, desfazer). |
| `UserSearchResults` | `.../amigos/components/` | Resultados da busca, com o botão variando conforme `friendship`. |
| `FriendRow`, `FriendRequestRow` | `.../amigos/components/` | Linha de amigo (com menu e confirmação) e linha de solicitação (aceitar/recusar/cancelar). |
| `DialogFriendRemoval` | `.../amigos/components/` | Confirmação de desfazer amizade. |
| `SeasonSummary`, `RankingList`, `RankingRow`, `ChampionCard`, `ClassroomScopePicker` | `.../ranking/components/` | Cabeçalho da temporada, lista paginada, linha com destaque para o próprio usuário, campeão anterior e seletor de turma. |
| `ClassroomCard`, `ClassroomInviteRow` | `.../turmas/components/` | Cartão da turma com o papel do usuário; linha de convite recebido. |
| `DialogFormClassroom`, `DialogJoinByCode`, `DialogResetSocialData` | `.../turmas/components/` | Criar/editar turma, entrar por código, restaurar o seed. |
| `ClassroomFolderCard`, `DialogFormClassroomFolder`, `DialogClassroomFolderExclusion` | `.../$turmaId/components/` | Pasta da turma (reaproveitando `FolderCover`), formulário e exclusão. |
| `DialogInviteMember`, `DialogLeaveClassroom` | `.../$turmaId/components/` | Convite por username ou link (com cópia para a área de transferência); sair da turma ou excluí-la. |
| `ClassroomContentTile`, `DialogAddContent`, `DialogFormContent`, `DialogContentExclusion` | `.../$pastaId/components/` | Item de conteúdo com menu por permissão; adicionar material do Revi ou enviar arquivo; editar e excluir. |
| `MemberRow`, `DialogMemberRemoval` | `.../membros/components/` | Linha de membro com troca otimista de papel; confirmação de remoção. |

### Regras e utilidades

- `src/utils/classroomPermissions.ts` — predicados de permissão, cobertos por
  `classroomPermissions.test.ts` (matriz completa dos três papéis).
- `src/utils/ranking.ts` — temporada, contagem para o reset, formatação e os
  pesos de XP, cobertos por `ranking.test.ts`.
- `src/utils/profile.ts` — `profilePath(username)`, coberto por `profile.test.ts`.
- `src/utils/socialStorage.ts` — leitura/escrita/reset da chave `revi:social`,
  upsert do usuário logado e **virada de temporada** (zera o XP e arquiva o
  campeão quando o mês gravado é diferente do mês atual).
- `src/api/mockBackend.ts` — latência artificial de 320 ms, identidade lida do
  JWT real e persistência do banco falso.
- `src/mocks/social/schema.ts` e `seed.ts` — esquema e dados de demonstração.

### Comportamentos simulados

- **Carregamento**: `Spinner` + `sr-only` em toda leitura; `ProgressBar` no
  envio de arquivo.
- **Erro**: mensagens em pt-BR vindas do `ApiError`, inline com `role="alert"`.
- **Confirmação**: diálogo dedicado antes de remover amigo, membro, pasta,
  conteúdo, turma, e antes de sair da turma ou restaurar a demonstração.
- **Estados vazios**: sem amigos, sem solicitações, sem resultados de busca, sem
  turmas, sem pastas, sem conteúdo e ranking vazio — cada um com uma frase
  específica e, quando faz sentido, um caminho de saída.
- **Permissões**: a interface esconde o que não pode ser feito, e o service
  recusa de verdade com `403` — esconder um botão não é autorização.

---

## 2. Dados mockados

Persistidos em `localStorage`, chave **`revi:social`**. O banco é descartado e
re-semeado quando `version` muda ou quando outra conta entra no navegador
(`ownerUserId` diferente). O botão "Restaurar dados de demonstração" no `/turmas`
força o mesmo efeito.

### DTOs devolvidos pelos services (o que o backend precisa produzir)

```ts
// src/types/api/social.ts
interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  xp: number;              // XP da temporada corrente
}

// src/types/api/friend.ts
type FriendshipStatus =
  | "none" | "friends" | "request-sent" | "request-received" | "self";

interface Friend extends PublicUser { friendsSince: string }   // ISO 8601

interface FriendRequest {
  id: string;
  user: PublicUser;                       // sempre o outro lado
  direction: "received" | "sent";
  createdAt: string;
}

interface UserSearchResult extends PublicUser { friendship: FriendshipStatus }

// src/types/api/profile.ts
interface SharedClassroom { id: string; name: string; color: string }

interface PublicProfile {
  user: PublicUser;
  friendship: FriendshipStatus;           // inclui "self"
  pendingRequestId: string | null;        // para aceitar/cancelar do perfil
  flashcards: number;
  quizzes: number;
  globalPosition: number | null;          // null se ainda não pontuou
  globalTotal: number;
  friendCount: number;
  mutualFriends: PublicUser[];            // vazio no próprio perfil
  sharedClassrooms: SharedClassroom[];    // só as em comum
}

// src/types/api/ranking.ts
type RankingScope = "global" | "friends" | "classroom";

interface RankingEntry {
  position: number;                       // absoluta no escopo, começa em 1
  user: PublicUser;
  xp: number;
  flashcards: number;
  quizzes: number;
  isCurrentUser: boolean;
}

interface RankingPage {
  entries: RankingEntry[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

interface RankingSeason { id: string; startsAt: string; endsAt: string }  // id "2026-09"

interface RankingSummary {
  season: RankingSeason;
  position: number | null;                // null quando ainda não pontuou
  xp: number;
  flashcards: number;
  quizzes: number;
  total: number;
}

interface SeasonChampion {
  seasonId: string;
  scope: RankingScope;
  classroomId: string | null;
  user: PublicUser;
  xp: number;
}

// src/types/api/classroom.ts
type ClassroomRole = "owner" | "editor" | "viewer";

interface Classroom {
  id: string;
  name: string;
  description: string;
  color: string;                          // hex de seis dígitos
  ownerId: string;
  ownerUsername: string;
  role: ClassroomRole;                    // papel do usuário atual, já resolvido
  memberCount: number;
  folderCount: number;
  createdAt: string;
}

interface ClassroomMember {
  id: string;                             // id da associação, não do usuário
  classroomId: string;
  user: PublicUser;
  role: ClassroomRole;
  joinedAt: string;
}

interface ClassroomFolder {
  id: string;
  classroomId: string;
  name: string;
  color: string;
  contentCount: number;
  createdAt: string;
}

type ClassroomContentKind = "flashcards" | "summary" | "quiz" | "pdf" | "image";

interface ClassroomContent {
  id: string;
  classroomId: string;
  folderId: string;
  kind: ClassroomContentKind;
  title: string;
  description: string;
  authorId: string;                       // define quem edita/exclui
  authorUsername: string;
  fileName: string | null;                // só para pdf e image
  fileSize: number | null;
  createdAt: string;
  updatedAt: string;
}

type ClassroomInviteStatus = "pending" | "accepted" | "declined" | "revoked";

interface ClassroomInvite {
  id: string;
  classroomId: string;
  classroomName: string;
  classroomColor: string;
  code: string;
  role: "editor" | "viewer";
  status: ClassroomInviteStatus;
  invitedBy: PublicUser;
  invitee: PublicUser | null;             // null = convite por link
  createdAt: string;
  expiresAt: string | null;
}

interface ClassroomInvitePreview {
  invite: ClassroomInvite;
  memberCount: number;
  owner: PublicUser;
}
```

### Esquema interno do mock (`src/mocks/social/schema.ts`)

Tabelas planas com ids; os joins acontecem nos services. Só existe enquanto o
mock existir — o backend não precisa reproduzir este formato, apenas os DTOs
acima.

```ts
interface SocialDatabase {
  version: number;
  ownerUserId: string;         // para quem este banco foi semeado
  seasonId: string;            // "YYYY-MM" — dispara a virada de temporada
  users: SocialUserRecord[];         // { id, username, displayName, avatarUrl, flashcards, quizzes }
  friendships: FriendshipRecord[];   // { id, userIdA, userIdB, createdAt }  — par não ordenado
  friendRequests: FriendRequestRecord[]; // { id, fromId, toId, status, createdAt }
  classrooms: ClassroomRecord[];     // { id, name, description, color, ownerId, createdAt }
  members: ClassroomMemberRecord[];  // { id, classroomId, userId, role, joinedAt }
  folders: ClassroomFolderRecord[];  // { id, classroomId, name, color, createdAt }
  contents: ClassroomContentRecord[];// + kind, title, description, authorId, fileName, fileSize
  invites: ClassroomInviteRecord[];  // { id, classroomId, code, role, status, invitedById, inviteeId, expiresAt }
  champions: SeasonChampionRecord[]; // { seasonId, scope, classroomId, userId, xp }
  reviMaterials: ReviMaterialRecord[]; // catálogo "Do Revi" do seletor de conteúdo
}
```

Observações de modelagem que valem para o backend:

- **XP é derivado, não armazenado**: `xp = flashcards × 10 + quizzes × 25`
  (`xpFromActivity` em `src/utils/ranking.ts`). O `PublicUser.xp` é o valor já
  calculado da temporada corrente.
- **`SocialUserRecord` não guarda e-mail**: a busca por username não deve
  devolver contato.
- **Amizade é um par não ordenado**, uma linha só; a solicitação é uma entidade
  separada com estado.
- **O conteúdo guarda `authorId`** porque é dele que saem as regras de edição e
  exclusão.
- **O arquivo em si não é guardado** no mock: só nome, tamanho e tipo. O
  `localStorage` não comporta binário — no backend isso vira upload real.
- **`PublicProfile` é relativo a quem pede**: `friendship`, `pendingRequestId`,
  `mutualFriends` e `sharedClassrooms` mudam conforme o solicitante, então a
  resposta **não pode ser cacheada por username sozinho** — a chave de cache tem
  de incluir o usuário autenticado.
- **O perfil expõe o mínimo**: nunca e-mail, nunca a lista completa de turmas da
  pessoa, nunca amigos que não sejam em comum. `friendCount` é só um número.

### Seed

14 usuários fictícios com XP entre ~130 e ~3.200, mais o usuário logado; 4
amizades, 2 solicitações recebidas e 1 enviada; 4 turmas, sendo três com o
usuário como **dono**, **editor** e **membro** (é o que permite demonstrar
as permissões sem uma segunda conta) e uma quarta que origina o convite
pendente; 8 pastas, 14 conteúdos com autores variados, 3 convites (nominal
recebido, link ativo, nominal enviado) e os campeões do mês anterior por escopo.
Todas as datas são relativas ao momento da semeadura.

---

## 3. Endpoints que o backend precisará implementar

Rotas sugeridas no estilo do `docs/API.md`. Todas exigem `Authorization: Bearer
<accessToken>`; o usuário atual sai do token, nunca do corpo. A coluna "Hoje"
aponta a função que simula o endpoint.

### Perfil público — `src/api/profile.ts`

| Método | Rota | Entrada | Saída | Autorização | Hoje |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/users/{username}` | `username` na rota (case-insensitive, aceita `@` na frente) | `PublicProfile` | Autenticado; `404` se o username não existe | `getPublicProfile` |

A resposta é **relativa a quem chama** (ver a nota de cache acima). `globalPosition`
sai da mesma ordenação de `GET /api/ranking?scope=global`, incluindo o desempate por
username — se os dois divergirem, o usuário vê dois números diferentes para a mesma
coisa. Quem tem `xp = 0` vem com `globalPosition: null` em vez de aparecer no fim da
fila.

### Usuários e amizade — `src/api/friends.ts`

| Método | Rota | Entrada | Saída | Autorização | Hoje |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/users/search?username={termo}` | `termo` (mín. 2 caracteres) | `UserSearchResult[]` (máx. 20, prefixo antes de "contém") | Autenticado | `searchUsers` |
| `GET` | `/api/friends` | — | `Friend[]` (ordenado por XP desc.) | Autenticado | `listFriends` |
| `GET` | `/api/friends/requests` | — | `FriendRequest[]` pendentes, recebidas e enviadas | Autenticado | `listFriendRequests` |
| `POST` | `/api/friends/requests` | `{ userId }` | `FriendRequest` | Não pode ser o próprio; `409` se já amigos ou já pendente | `sendFriendRequest` |
| `POST` | `/api/friends/requests/{id}/accept` | — | `Friend` | Só o destinatário (`403`) | `acceptFriendRequest` |
| `POST` | `/api/friends/requests/{id}/decline` | — | `204` | Só o destinatário (`403`) | `declineFriendRequest` |
| `DELETE` | `/api/friends/requests/{id}` | — | `204` | Só o remetente (`403`) | `cancelFriendRequest` |
| `DELETE` | `/api/friends/{userId}` | — | `204` | Só quem faz parte da amizade; `404` se não são amigos | `removeFriend` |

### Ranking — `src/api/ranking.ts`

| Método | Rota | Entrada | Saída | Autorização | Hoje |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/ranking?scope={global\|friends\|classroom}&classroomId=&page=&pageSize=` | `page` (1), `pageSize` (20) | `RankingPage` | `classroom` exige ser membro (`403`); `classroomId` obrigatório nesse escopo (`400`) | `getRanking` |
| `GET` | `/api/ranking/summary?scope=&classroomId=` | — | `RankingSummary` | idem | `getRankingSummary` |
| `GET` | `/api/ranking/champions/previous?scope=&classroomId=` | — | `SeasonChampion \| null` | idem | `getPreviousChampion` |

Empates são desempatados por `username` para a ordem não oscilar entre duas
leituras. O ranking global do mock inclui todos os usuários; ver os pontos em
aberto sobre o que "global" deve significar em produção.

### Turmas — `src/api/classrooms.ts`

| Método | Rota | Entrada | Saída | Autorização | Hoje |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/classrooms` | — | `Classroom[]` do usuário | Autenticado | `listClassrooms` |
| `GET` | `/api/classrooms/{id}` | — | `Classroom` | Membro; **`404` para não membro** (não confirmar existência) | `getClassroom` |
| `POST` | `/api/classrooms` | `{ name, description, color }` | `Classroom` (criador vira `owner`) | Autenticado, sem limite de quantidade | `createClassroom` |
| `PATCH` | `/api/classrooms/{id}` | `{ name, description, color }` | `Classroom` | Só o dono (`403`) | `updateClassroom` |
| `DELETE` | `/api/classrooms/{id}` | — | `204` (cascata em pastas, conteúdos, membros e convites) | Só o dono (`403`) | `deleteClassroom` |
| `POST` | `/api/classrooms/{id}/leave` | — | `204` | Membro não dono; dono recebe `403` | `leaveClassroom` |

### Membros

| Método | Rota | Entrada | Saída | Autorização | Hoje |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/classrooms/{id}/members` | — | `ClassroomMember[]` (dono primeiro) | Qualquer membro | `listMembers` |
| `PATCH` | `/api/classrooms/{id}/members/{memberId}` | `{ role: "editor" \| "viewer" }` | `ClassroomMember` | Só o dono; `400` ao tentar alterar o papel do dono | `updateMemberRole` |
| `DELETE` | `/api/classrooms/{id}/members/{memberId}` | — | `204` (perde acesso a tudo) | Só o dono; `400` ao tentar remover o dono | `removeMember` |

### Pastas

| Método | Rota | Entrada | Saída | Autorização | Hoje |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/classrooms/{id}/folders` | — | `ClassroomFolder[]` | Qualquer membro | `listFolders` |
| `GET` | `/api/classrooms/{id}/folders/{folderId}` | — | `ClassroomFolder` | Qualquer membro | `getFolder` |
| `POST` | `/api/classrooms/{id}/folders` | `{ name, color }` | `ClassroomFolder` | Só o dono (`403`) | `createFolder` |
| `PATCH` | `/api/classrooms/{id}/folders/{folderId}` | `{ name, color }` | `ClassroomFolder` | Só o dono (`403`) | `updateFolder` |
| `DELETE` | `/api/classrooms/{id}/folders/{folderId}` | — | `204` (cascata no conteúdo) | Só o dono (`403`) | `deleteFolder` |

### Conteúdo

| Método | Rota | Entrada | Saída | Autorização | Hoje |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/classrooms/{id}/folders/{folderId}/contents` | — | `ClassroomContent[]` (mais recente primeiro) | Qualquer membro | `listContents` |
| `POST` | `/api/classrooms/{id}/folders/{folderId}/contents` | `{ kind, title, description, reviMaterialId? }` | `ClassroomContent` | Dono ou editor (`403` para membro) | `createContent` |
| `POST` | `/api/classrooms/{id}/folders/{folderId}/contents/upload` | `multipart/form-data`: `file`, `title`, `description` | `ClassroomContent` (`kind` = `pdf` ou `image`) | Dono ou editor | `createContent` com `fileName`/`fileSize` |
| `PATCH` | `/api/classrooms/{id}/contents/{contentId}` | `{ title, description }` | `ClassroomContent` | **Só o autor** — nem o dono edita material alheio (`403`) | `updateContent` |
| `DELETE` | `/api/classrooms/{id}/contents/{contentId}` | — | `204` | **Autor ou dono** — o dono modera (`403` para os demais) | `deleteContent` |
| `GET` | `/api/me/materials` | — | materiais gerados no Revi, para o seletor "Do Revi" | Autenticado | `listReviMaterials` |

### Convites

| Método | Rota | Entrada | Saída | Autorização | Hoje |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/classrooms/{id}/invites` | — | `ClassroomInvite[]` pendentes | Só o dono (`403`) | `listInvites` |
| `POST` | `/api/classrooms/{id}/invites` | `{ username, role }` | `ClassroomInvite` | Só o dono; `404` username inexistente; `409` já membro ou já convidado | `inviteByUsername` |
| `POST` | `/api/classrooms/{id}/invites/link` | `{ role }` | `ClassroomInvite` com `code` | Só o dono | `createInviteLink` |
| `DELETE` | `/api/classrooms/{id}/invites/{inviteId}` | — | `204` (status vira `revoked`) | Só o dono | `revokeInvite` |
| `GET` | `/api/me/invites` | — | `ClassroomInvite[]` nominais pendentes | Autenticado | `listMyInvites` |
| `GET` | `/api/invites/{code}` | — | `ClassroomInvitePreview` | `404` inexistente; `410` usado/revogado/expirado; `403` nominal de outra pessoa; `409` já membro | `getInviteByCode` |
| `POST` | `/api/invites/{inviteId}/accept` | — | `Classroom` | Convite nominal se esgota; link segue válido; `409` já membro | `acceptInvite` |
| `POST` | `/api/invites/{inviteId}/decline` | — | `204` | Só o destinatário nominal (`403`) | `declineInvite` |

O link compartilhado no frontend tem o formato
`{origin}/turmas/convite/{code}`.

---

## 4. Pontos em aberto — validar antes de implementar o backend

1. **Link de convite: expiração e limite de usos.** O mock aceita
   `expiresAt: null` (sem prazo) e permite reutilização ilimitada do código.
   Definir prazo padrão, limite de usos e se o dono pode configurar isso.
2. **Fuso e horário do reset de XP.** Hoje o cálculo é em **horário local do
   dispositivo**, à meia-noite do dia 1º. Em produção precisa ser um instante
   único no servidor (UTC? America/Sao_Paulo?), senão dois alunos veem rankings
   diferentes no virar do mês.
3. **Quem entra no meio da temporada.** O XP é sempre da temporada corrente; não
   está definido se há proporcionalidade, carência mínima ou se o aluno novo
   simplesmente começa em zero.
4. **Pesos de XP.** `flashcard = 10`, `simulado = 25` foram escolhidos para a
   demonstração. Confirmar os valores reais, se resumo e mapa mental também
   pontuam, e se há teto diário para evitar farm.
5. **Destino da turma quando o dono sai ou apaga a conta.** Hoje o dono
   simplesmente **não pode sair** (`403`) — só excluir a turma. Decidir entre
   transferência de posse, arquivamento ou exclusão em cascata.
6. **Conteúdo de quem saiu.** No mock, sair ou ser removido **não apaga** o que
   a pessoa publicou; o material continua na turma com o nome do autor.
   Confirmar se é o comportamento desejado (e o que acontece na exclusão de
   conta).
7. **Editor pode criar pastas?** Hoje **não** — só o dono. O enunciado dizia
   "dentro da turma, o owner pode criar pastas", então isso foi implementado ao
   pé da letra, mas é uma restrição que pode incomodar na prática.
8. **Escopo do ranking global.** "Todos os usuários do Revi" fica pouco
   significativo em escala. Avaliar recortar por instituição, série ou região, e
   como paginar um ranking de milhões de linhas mantendo a posição do usuário.
9. **Anti-abuso na busca por username.** Definir *rate limit*, tamanho mínimo do
   termo (hoje 2) e se o usuário pode se tornar não-encontrável.
10. **Notificações.** Nada avisa sobre solicitação de amizade ou convite de
    turma fora do app. Definir se haverá push/e-mail e o gatilho.
11. **Upload de arquivo.** O mock só guarda nome, tamanho e tipo, com limite de
    20 MB e `accept=".pdf,image/*"`. Confirmar limite real, tipos aceitos,
    antivírus, storage e política de retenção.
12. **Visibilidade do perfil público.** Hoje qualquer usuário logado abre o perfil
    de qualquer outro. Definir se deve ser restrito a amigos e colegas de turma, se
    existe perfil privado, e se o usuário pode se tornar não-listável na busca.
13. **O que é público no perfil.** `friendCount` e a lista de amigos em comum são
    visíveis para estranhos. Confirmar se isso é aceitável — em especial para
    menores de idade, que são parte do público do Revi.
14. **Username é imutável?** A URL do perfil usa o username. Se ele puder mudar,
    o backend precisa de redirecionamento do antigo para o novo (ou a rota precisa
    passar a usar um id estável).
15. **Moderação e denúncia.** O dono pode excluir conteúdo alheio, mas não há
    canal para denunciar material impróprio numa turma de terceiros.

---

## 5. Como testar

```bash
bun install
bun run test     # 138 testes, incluindo a matriz de permissões e a temporada
bun run lint
bun run build
bun run dev      # http://127.0.0.1:5173
```

É preciso **estar logado**: as rotas ficam sob `RequireAuth`, que depende da API
real (`VITE_API_BASE_URL`). O mock social identifica o usuário atual pelo mesmo
JWT dessa sessão.

Roteiro de demonstração:

1. `/amigos` — buscar `ana`, enviar solicitação para alguém novo, aceitar uma
   recebida, desfazer uma amizade.
2. `/ranking` — alternar Global / Amigos / Turma, ver a própria linha destacada,
   conferir a contagem para o reset e o campeão do mês anterior.
3. `/turmas` — criar turma, criar pasta, adicionar material do Revi e um
   arquivo, gerar link de convite e copiá-lo.
4. Abrir a turma em que o papel é **editor**: o menu de excluir aparece no
   conteúdo próprio e some no de outra pessoa; não há FAB de criar pasta.
5. Abrir a turma em que o papel é **membro**: nenhuma ação de escrita.
6. Aceitar o convite pendente e depois sair da turma — ela some da lista e o
   acesso direto pela URL passa a falhar.
7. Clicar em qualquer nome — no ranking, na lista de amigos, na busca, entre os
   membros de uma turma, no autor de um conteúdo — e cair em
   `/usuarios/:username`. O XP e a posição do perfil batem com os da linha de
   origem; o botão de amizade muda conforme a relação; turmas e amigos em comum
   aparecem quando existem. `/usuarios/naoexiste` dá erro em pt-BR, e o seu
   próprio username mostra "Ver seu perfil".
8. Recarregar a página (F5): tudo persiste. Usar "Restaurar dados de
   demonstração" para voltar ao seed.
