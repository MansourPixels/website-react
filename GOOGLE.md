# Google Workspace e o sistema de Tarefas

O frontend do Revi já importa material do Google Drive e publica cada tarefa na
Google Agenda, **inteiramente pelo navegador**, sem nenhum endpoint novo no
`revi_back`. As tarefas ficam em `localStorage`, atrás de uma fachada que já tem a
forma das chamadas de API.

**Motivação**: o Revi terminava no material. O aluno capturava, categorizava e
estudava, mas nada no app sabia que a prova de Biologia é sexta — e a única porta de
entrada de material era a câmera, o que deixava de fora o aluno cujo professor
distribui tudo por Drive. As tarefas trazem o **prazo** para dentro do produto, e a
Agenda é o que faz o lembrete tocar no celular mesmo com o Revi fechado.

> **Nota importante**: o modo navegador é uma entrega completa, não um mock. O que
> ele **não** consegue é manter a conexão viva além de ~1 h nem tocar um lembrete
> sem o aluno abrir o app. É esse limite, e só ele, que justifica este documento.

Os contratos deste documento já viraram pedido de implementação: seis prompts prontos para
`/opsx:propose` no `revi-back`, em [`docs/prompts/`](docs/prompts/00-README.md).

---

## 1. O que já está implementado no frontend

### A camada de acesso ao Google

Segue exatamente a forma de `src/utils/speech.ts` + `setSpeechDriver`: uma fachada
com driver trocável, registrado uma única vez no provider.

| Arquivo | Papel |
| --- | --- |
| `src/utils/googleAuth.ts` | **A fachada.** `isConfigured`, `getAuthMode`, `ensureAccessToken`, `requestConsent`, `revokeAccess`, `hasScope`, e a interface `GoogleAuthDriver`. **`setGoogleAuthDriver(driver)` é o ponto de troca.** |
| `src/utils/googleAuthDrivers/browserGis.ts` | Driver padrão: Google Identity Services token client. |
| `src/utils/googleAuthDrivers/backendProxy.ts` | Driver de backend, **já escrito**, atrás de `VITE_GOOGLE_BACKEND=true`. Consome os contratos da seção 3. |
| `src/utils/googleStorage.ts` | Chave `revi:google` (`{ accessToken, expiresAt, scope }`) e o handshake de `sessionStorage`, espelhando `spotifyStorage.ts`. |
| `src/utils/googleScripts.ts` | Carregadores idempotentes, sob demanda, do GIS e do `gapi`. |
| `src/utils/googleDrive.ts` | `downloadDriveFile(ref)` → `File` pronto para o upload. |
| `src/utils/googlePicker.ts` | `openDrivePicker(token)` → `DriveFileRef \| null`. |
| `src/utils/googleCalendar.ts` | `createTaskEvent` / `updateTaskEvent` / `deleteTaskEvent` / `findTaskEvent`. |
| `src/contexts/GoogleContext.tsx` | Máquina de estados e o único lugar que registra o driver. |
| `src/components/GoogleConnectCard.tsx` | O cartão de conexão, na seção Google do Perfil. |

Drive e Agenda **nunca** sabem de onde veio o token: pedem `ensureAccessToken()`.

### Importar material do Drive

Nenhum fluxo novo. O arquivo do Drive entra onde entra um arquivo do disco:

```
Picker → DriveFileRef → downloadDriveFile() → File
      → showPreview()  (Camera.tsx, já existia)
      → PhotoReview → DialogCategorizeImage → suggestFolder → uploadContent
```

O botão aparece nas duas superfícies de captura — pílula acima do obturador no
ponteiro grosso (`Camera.tsx`), botão tertiary abaixo da dropzone no ponteiro fino
(`CaptureDesk.tsx`) — e **só** quando há configuração do Google no ambiente. Como as
duas são o mesmo componente, a câmera do assunto ganhou o recurso de graça.

Documento, apresentação e planilha do Google não têm bytes para baixar: são
exportados como PDF (`/drive/v3/files/{id}/export`). O resto vem por `?alt=media`. O
resultado passa por `contentTypeOf()` e `ensureUploadFilename()` de
`src/utils/materials.ts` — as regras do upload continuam num lugar só.

### Tarefas

| Arquivo | Papel |
| --- | --- |
| `src/types/Task.ts` | O tipo de domínio. |
| `src/utils/tasksStorage.ts` | Chave `revi:tarefas`, `sanitizeTask`/`sanitizeTasks`, `isOverdue`. Puro e testado (`tasksStorage.test.ts`). |
| `src/api/tasks.ts` | **A fachada de persistência.** É o único arquivo que muda quando `/api/tasks` existir. |
| `src/routes/(private)/tarefas/` | A tela: `index.tsx`, `DialogFormTarefa`, `TarefaRow`, `DialogTarefaExclusion`. |
| `src/utils/taskCalendar.ts` | A ponte tarefa ↔ evento. Nunca lança: o resultado vira `syncState`. |

A rota `/tarefas` é alcançada pela Trilha e pelo Perfil, e entra em
`extraBottomNavigationRoutes` — **não** é uma sétima aba.

Estados cobertos: carregando, erro com `reloadKey`/retry, vazio com saída,
**Atrasadas** (derivado do relógio, nunca persistido), **Próximas**, **Concluídas**
(recolhida), sincronizada, falha de sincronização com "Tentar de novo" na própria
linha, e a faixa opcional de sincronizar em lote — sempre por clique.

### O consentimento parcial

A tela de consentimento do Google deixa o aluno desmarcar escopos um a um. O token
que volta traz o `scope` realmente concedido, e `hasDrive` / `hasCalendar` saem
dele. Importar sem ter concedido o Drive **não** vira erro genérico: vira o issue
`scopeMissing`, com um caminho para pedir o consentimento de novo.

### Sair da conta

`AuthContext.signOut` chama `clearGoogleTokens()` antes de limpar a sessão do Revi —
o token do Google dá acesso de **escrita** à agenda pessoal do aluno. O texto do
`DialogSignOut` diz isso.

---

## 2. Por que o backend é necessário

O cliente OAuth do tipo "Web application" do Google **exige `client_secret` no
endpoint de token**. A troca de código puro-navegador que o Spotify aceita (PKCE sem
segredo) é rejeitada pelo Google. Por isso o modo padrão usa
`google.accounts.oauth2.initTokenClient`, que devolve um access token direto no
navegador, sem segredo — e, em troca, **sem refresh token**.

As duas consequências:

1. **A conexão morre em ~1 h.** `ensureAccessToken()` tenta renovar em silêncio
   (`prompt: "none"`), o que funciona enquanto o aluno tiver sessão Google ativa
   naquele navegador. Fora disso, ele precisa clicar em "Conectar" de novo. Num PWA
   instalado, onde a sessão do navegador nem sempre é compartilhada, isso incomoda.
2. **O lembrete só existe se o aluno abrir o app.** Uma tarefa criada offline, ou
   criada com o Google desconectado, só chega à Agenda quando alguém clica. Um
   backend com refresh token publica o evento no momento em que a tarefa é criada,
   independentemente do aparelho.

Some-se a isso que hoje as tarefas vivem em `localStorage`: trocar de aparelho
perde tudo, e a turma não tem como compartilhar uma entrega.

---

## 3. Contratos de backend

### 3.1 Conexão com o Google

| Método | Caminho | Descrição |
|---|---|---|
| `GET` | `/api/google/status` | Estado da conexão do usuário autenticado |
| `GET` | `/api/google/authorize-url?returnTo=&timeZone=` | URL de consentimento, com `state` assinado |
| `GET` | `/api/google/callback?code&state` | Troca o código (com `client_secret`), guarda o refresh token e redireciona |
| `GET` | `/api/google/token` | Access token cunhado do refresh token |
| `DELETE` | `/api/google/connection` | Revoga e apaga a conexão |

**`GET /api/google/status`**
```json
{ "connected": true,
  "email": "aluno@escola.com",
  "scopes": ["https://www.googleapis.com/auth/drive.file",
             "https://www.googleapis.com/auth/calendar.events",
             "https://www.googleapis.com/auth/userinfo.email"] }
```

**`GET /api/google/authorize-url?returnTo=/tarefas&timeZone=America/Sao_Paulo`** → `{ "url": "https://accounts.google.com/o/oauth2/v2/auth?..." }`

A URL precisa levar `access_type=offline` e `prompt=consent` — sem os dois o Google
não devolve refresh token na segunda autorização. O `state` tem de ser assinado e
amarrado ao usuário; `returnTo` só pode ser um caminho relativo do próprio app
(barrar `//host` e URLs absolutas evita open redirect).

`timeZone` é o fuso do aluno (`Intl.DateTimeFormat().resolvedOptions().timeZone`), guardado
em `google_accounts.time_zone` e usado pelo servidor para montar o evento. É a única mudança
que o `backendProxyDriver` precisa: uma linha a mais na query.

**`GET /api/google/callback?code&state`**: troca com `client_secret`, persiste o
refresh token **cifrado**, e redireciona para `{FRONT_URL}/google/callback?state=...`.
Em caso de recusa, redireciona com `?error=access_denied`. Essa rota já existe no
frontend (`src/routes/(google)/callback/index.tsx`).

**`GET /api/google/token`**
```json
{ "accessToken": "ya29...", "expiresIn": 3599,
  "scope": "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/calendar.events" }
```

Deve ser cacheado no servidor até perto de expirar — o Google limita a emissão de
tokens por refresh token.

> **"Não conectado" tem de ser `404`, nunca `401`.** O `backendProxyDriver` trata 401, 403 e
> 404 como "desconectado", e é por isso que ele não quebra a tela enquanto o endpoint não
> existir — mas só o `404` chega até ele. O `apiFetch` (`src/api/client.ts`) intercepta todo
> `401` antes do chamador, dispara `performRefresh()` do token do **Revi** e, no fracasso,
> emite `revi:auth-expired` e derruba a sessão inteira. Um `401` aqui desloga o aluno do Revi
> por ele não ter conectado o Google.

> O `scope` devolvido tem de ser o **concedido**, não o pedido. É dele que saem
> `hasDrive` e `hasCalendar`.

### 3.2 Tarefas

| Método | Caminho | Descrição |
|---|---|---|
| `GET` | `/api/tasks` | Lista as tarefas do usuário |
| `POST` | `/api/tasks` | Cria |
| `PATCH` | `/api/tasks/{id}` | Edita título, matéria, assunto e prazo |
| `DELETE` | `/api/tasks/{id}` | Exclui (e remove o evento da Agenda) |
| `PATCH` | `/api/tasks/{id}/complete` | `{ "done": true }` |

**Resposta** (o shape de `src/types/Task.ts`, um para um):
```json
{ "id": "0198...",
  "title": "Relatório de laboratório",
  "motherFolderId": "0198...", "motherFolderName": "Biologia", "motherFolderColor": "#16a34a",
  "childFolderId": "0198...", "childFolderName": "Genética",
  "dueAt": "2026-09-18T23:59:00Z",
  "done": false, "completedAt": null,
  "googleEventId": "abc123", "syncState": "sincronizada",
  "createdAt": "2026-09-16T10:00:00Z", "updatedAt": "2026-09-16T10:00:00Z" }
```

**`motherFolderName` e `motherFolderColor` são snapshot de propósito**: a lista
renderiza sem uma requisição por linha, e uma tarefa cuja pasta foi apagada continua
legível em vez de virar "—". Se o backend preferir devolvê-los por join, tudo bem —
o importante é que venham na resposta.

`atrasada` **não** é um campo: é derivado de `!done && dueAt < agora`. Estado
persistido que depende do relógio fica errado sozinho.

**A sincronização ficou no servidor** (ver 3.3): `syncState` e `googleEventId` são escritos
por ele, e o frontend só os exibe. O `setTaskSync(id, syncState, googleEventId)` de
`src/api/tasks.ts` deixa de existir, e o "Tentar de novo" de cada linha passa a chamar
`POST /api/tasks/{id}/sync` → `202`, que só reenfileira.

`motherFolderName` e `motherFolderColor` viajam no `TaskInput` por herança do modo
`localStorage`, mas o servidor **ignora** os dois e resolve o snapshot a partir de
`motherFolderId` — o cliente não é fonte de verdade para o nome de uma pasta que o servidor
conhece.

### 3.3 Decisão: a Agenda é sincronizada no servidor

É o que faz o lembrete existir sem o app aberto, e é a razão principal de o backend valer a
pena. A publicação é **assíncrona, por RabbitMQ** (`revi.tasks.calendar.*`), espelhando
`revi.content.categorization.*`: criar uma tarefa não espera o Google, e o Google fora do ar
não impede o aluno de anotar uma entrega. Aluno sem conexão Google fica em `local` — isso não
é falha, e não vai para a DLQ.

O contrato do evento que o frontend já usa, para manter a paridade:

```jsonc
{
  "summary": "<título da tarefa>",           // "✓ <título>" quando concluída
  "description": "Entrega de <Matéria> · <Assunto>\nCriado pelo Revi.",
  "start": { "dateTime": "<dueAt>", "timeZone": "<tz do aluno>" },
  "end":   { "dateTime": "<dueAt + 30min>", "timeZone": "<tz do aluno>" },
  "source": { "title": "Revi", "url": "<origin>/tarefas" },
  "extendedProperties": { "private": { "reviTaskId": "<task.id>" } },
  "reminders": { "useDefault": false, "overrides": [
    { "method": "popup", "minutes": 1440 },
    { "method": "popup", "minutes": 60 }
  ] }
}
```

**`extendedProperties.private.reviTaskId` é o que torna a operação idempotente**:
antes de criar, `GET /events?privateExtendedProperty=reviTaskId=<id>`; se já existir,
`PATCH` em vez de um segundo evento. É isso que impede um retry de duplicar a
entrega na agenda do aluno — vale tanto no cliente quanto no servidor.

O fuso precisa ser o do aluno, não o do servidor — um servidor em UTC criando evento para um
aluno em São Paulo erra por três horas. O front resolve com
`Intl.DateTimeFormat().resolvedOptions().timeZone`, com `America/Sao_Paulo` de reserva, e
manda esse valor no `authorize-url`; o servidor o guarda em `google_accounts.time_zone` e lê
de lá.

### 3.4 Decisão: importar do Drive sem passar pelo celular

`POST /api/contents/from-drive { "fileId": "...", "childFolderId": "..." }`

Hoje o arquivo desce para o aparelho do aluno e sobe de volta para o MinIO. Num PDF
de aula de 40 MB, num 4G de ônibus, isso é o dobro do tráfego pelo pior caminho. Com
o refresh token no servidor, o backend baixa direto do Drive. A tela não muda: só o
corpo de um handler em `Camera.tsx`.

---

## 4. Modelo de dados

Próxima migration livre: **`V23`** — `V20`, `V21` e `V22` já estão ocupadas no `revi-back`
(`content_extracted_text`, `classroom_ai_content`, `classroom_processing_failure_cascade`).
Duas tabelas, no formato que o `revi-back` já usa.

`V23__create_google_accounts_table.sql`
```sql
CREATE TABLE google_accounts (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    google_subject VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    -- Cifrado na aplicação (ver seção 7). Nunca em texto puro.
    refresh_token_encrypted TEXT NOT NULL,
    scopes TEXT NOT NULL,
    time_zone VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_google_accounts_owner UNIQUE (owner_id)
);

CREATE INDEX idx_google_accounts_owner_id ON google_accounts (owner_id);
```

`V24__create_tasks_table.sql`
```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    mother_folder_id UUID REFERENCES mother_folders (id) ON DELETE SET NULL,
    -- Snapshot: a tarefa sobrevive à exclusão da pasta.
    mother_folder_name VARCHAR(255) NOT NULL,
    mother_folder_color VARCHAR(7) NOT NULL,
    child_folder_id UUID REFERENCES child_folders (id) ON DELETE SET NULL,
    child_folder_name VARCHAR(255),
    due_at TIMESTAMPTZ NOT NULL,
    done BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    google_event_id VARCHAR(255),
    sync_state VARCHAR(20) NOT NULL DEFAULT 'local',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_tasks_owner_id ON tasks (owner_id);
CREATE INDEX idx_tasks_owner_due ON tasks (owner_id, due_at);
```

Não existe coluna `overdue`: é derivada na leitura.

---

## 5. Variáveis de ambiente

### Frontend (`.env`)

```bash
VITE_GOOGLE_CLIENT_ID=      # cliente OAuth "Web application"
VITE_GOOGLE_API_KEY=        # chave restrita à Picker API
VITE_GOOGLE_APP_ID=         # número do projeto no Google Cloud
VITE_GOOGLE_BACKEND=false   # true = token vem do revi-back
```

`VITE_GOOGLE_API_KEY` e `VITE_GOOGLE_APP_ID` continuam necessários **mesmo no modo
backend**: o Picker roda no navegador do aluno nos dois modos.

### Backend (`application.yaml`)

```yaml
revi:
  google:
    client-id: ${GOOGLE_CLIENT_ID}
    client-secret: ${GOOGLE_CLIENT_SECRET}
    redirect-uri: ${GOOGLE_REDIRECT_URI:http://localhost:8080/api/google/callback}
    front-url: ${GOOGLE_FRONT_URL:http://127.0.0.1:5173}
    # Chave de cifra do refresh token em repouso.
    token-encryption-key: ${GOOGLE_TOKEN_ENCRYPTION_KEY}
```

No Google Cloud Console é preciso habilitar **Google Picker API**, **Google Drive
API** e **Google Calendar API**, e registrar como *Authorized JavaScript origins*
tanto `http://127.0.0.1:5173` (o `vite.config.ts` fixa esse host) quanto a URL de
produção. No modo backend, o `redirect-uri` acima também entra em *Authorized
redirect URIs*.

---

## 6. O que trocar no frontend quando o backend subir

A lista exata, e ela é curta:

1. `.env`: `VITE_GOOGLE_BACKEND=true`. O `backendProxyDriver` já está escrito e o
   `GoogleProvider` já o registra a partir dessa variável.
2. `src/utils/googleAuthDrivers/backendProxy.ts`: mandar `&timeZone=` junto do `returnTo` no
   `authorize-url`. Uma linha.
3. `src/api/tasks.ts`: trocar cada corpo por um `apiFetch` nos caminhos da seção
   3.2. As assinaturas já estão nesse formato.
4. `src/api/onboarding.ts`: idem, nos caminhos da seção 8.2. O `ownerId` como parâmetro some.

Com a sincronização da Agenda no servidor (3.3), `src/utils/taskCalendar.ts` e as chamadas a
`publishTaskEvent`/`setTaskSync` em `src/routes/(private)/tarefas/index.tsx` saem — o
`syncState` chega pronto na resposta, e o "Tentar de novo" vira um `POST /api/tasks/{id}/sync`.

Com o import do Drive no servidor (3.4), o handler de importação em `Camera.tsx` troca
`downloadDriveFile()` + `uploadContent()` por uma chamada só. `openDrivePicker` continua no
navegador, e `VITE_GOOGLE_API_KEY`/`VITE_GOOGLE_APP_ID` continuam necessários.

**Nenhuma tela é reescrita.** Nenhum componente conhece `localStorage` nem
`googleapis.com`.

---

## 7. Segurança, decisões e pontos em aberto

1. **App não verificado.** `calendar.events` é escopo sensível. Enquanto o app
   estiver em "Testing" no Google Cloud Console, só as contas na lista de usuários de
   teste conseguem conectar — **limite de 100**. Para a entrega, cada integrante como
   usuário de teste basta; público aberto exige a verificação do Google, que leva
   semanas.
2. **`drive.file`, não `drive.readonly`.** O readonly é escopo **restrito** e
   exigiria avaliação de segurança. Com o `drive.file` o Revi só enxerga o que o
   aluno escolher no Picker — é menos poder e menos burocracia.
3. **Cifra do refresh token.** Ele vale uma sessão permanente na conta Google do
   aluno. Precisa ir cifrado para o banco, com chave fora do repositório e rotação
   prevista. Um dump de banco não pode virar acesso à agenda de ninguém.
4. **`state` assinado.** Sem isso o callback aceita um código de outra pessoa (CSRF
   de login). E `returnTo` só pode ser caminho relativo, ou vira open redirect.
5. **Revogação no logout — decidido: não revoga.** Sair do Revi não toca no Google. Com o
   refresh token no servidor, a conexão é da conta, não da sessão: sair no laboratório da
   escola não pode desligar a agenda do celular do aluno. Só o
   `DELETE /api/google/connection` revoga em `https://oauth2.googleapis.com/revoke`. No modo
   navegador o `clearGoogleTokens()` do `signOut` continua válido, porque lá o token *é* do
   aparelho.
6. **Limite de tamanho do arquivo importado — decidido: teto no servidor.**
   `revi.google.drive.max-file-size`, 50 MB por padrão, verificado pelos metadados do Drive
   **antes** do download. Google Docs nativos não trazem `size`, então para eles o teto é
   aplicado durante o streaming. O Picker continua sem impor limite nenhum.
7. **Pop-up em PWA standalone no iOS.** O consentimento do GIS abre em pop-up, e o
   iOS em `display: "standalone"` é historicamente hostil a isso. Precisa de teste em
   iPhone instalado na tela de início; se falhar, o caminho é o modo backend, que usa
   redirect em vez de pop-up — e já está implementado.
8. **Fuso da tarefa — decidido: fica na conta.** `google_accounts.time_zone`, informado no
   `authorize-url`. Cobre todo aluno que não viaja, sem mexer no contrato de 3.2 nem no tipo
   `TaskInput`. O aluno que viaja entre conectar e criar a entrega continua errando o fuso —
   limitação conhecida e aceita.
9. **Tarefa de turma — decidido: o dono cria, a conclusão é individual.** `tasks` ganha
   `classroom_id`, e `done`/`syncState` saem de `tasks` para tabelas por par (tarefa, pessoa).
   Quem administra a turma (`ClassroomRole.canManageStructure()`) cria e edita; cada membro
   conclui a sua e recebe o evento na **própria** agenda. É o mais caro dos seis changes e o
   único que refatora o que os anteriores entregaram.
10. **Quantas contas por usuário.** `uq_google_accounts_user` assume uma. Aluno com
    conta pessoal e conta da escola vai querer escolher qual agenda recebe a entrega.

---

## 8. Onboarding

Depois do cadastro o aluno passa por `/onboarding`: boas-vindas, avatar,
conexões (Spotify e Google) e um mapa das funcionalidades. É obrigatório uma
vez, cada etapa é pulável, e o gate que o torna obrigatório precisa saber se
aquele usuário já concluiu.

**Motivação**: o cadastro terminava jogando o aluno direto na câmera. O avatar
nunca era personalizado, as duas integrações só existiam para quem entrava no
Perfil por conta própria, e ninguém era apresentado às seis abas nem aos quatro
modos de estudo.

> Este documento é o lugar dos contratos que ainda esperam o `revi-back`. O
> onboarding entra aqui pela mesma razão que as tarefas: a tela está pronta e
> completa, e o que falta é só onde guardar o fato. Se um dia ficar grande
> demais, esta seção se destaca num `ONBOARDING.md` sem perda nenhuma.

### 8.1 O que já está implementado no frontend

| Arquivo | Papel |
| --- | --- |
| `src/api/onboarding.ts` | **A fachada de persistência.** É o único arquivo que muda quando o endpoint existir |
| `src/utils/onboardingStorage.ts` | Chave `revi:onboarding`, no formato `{ [ownerId]: { completedAt } }`. Puro e testado |
| `src/utils/onboardingSteps.ts` | Os slugs das etapas e o parse do `?passo=`. Puro e testado |
| `src/contexts/OnboardingContext.tsx` | Resolve o estado uma vez por sessão e expõe `complete()` |
| `src/components/RequireOnboarding.tsx` | O gate, irmão do `RequireAuth`, composto dentro dele em `(private)/layout.tsx` |
| `src/routes/(onboarding)/` | A tela: `index.tsx` e os quatro painéis em `components/` |
| `src/components/AvatarPicker.tsx` | As cinco abas de peças, extraídas de `/perfil/avatar` para servir às duas telas |

A etapa atual vive na URL (`/onboarding?passo=conexoes`), e não em estado de
componente: `spotify.connect()` faz `window.location.assign` e derruba todo o
estado em memória. Pelo mesmo motivo **o avatar é gravado ao sair da etapa**, e
não no fim do fluxo.

O destino pretendido viaja no mesmo `?proximo=` que o login já usa, para que um
convite de turma aberto por quem ainda não tem conta sobreviva ao cadastro e ao
onboarding.

### 8.2 Contrato de backend

| Método | Caminho | Descrição |
|---|---|---|
| `GET` | `/api/whoami` | Ganha mais um campo (abaixo) |
| `POST` | `/api/whoami/onboarding` | Marca como concluído. `204`, sem corpo |

**`GET /api/whoami`**
```json
{ "ownerId": "0198...",
  "avatarUrl": "https://api.dicebear.com/10.x/big-smile/svg?eyesVariant=...",
  "onboardingCompletedAt": "2026-09-16T10:00:00Z" }
```

`onboardingCompletedAt` é `null` enquanto o aluno não terminou. **Não existe um
booleano `onboardingCompleted`**: a data responde "já concluiu?" e mais a
pergunta de quando, que é o que permite medir se o fluxo está sendo abandonado.

**`POST /api/whoami/onboarding`** → `204`. Precisa ser **idempotente**: a segunda
chamada não reescreve a data. Sem isso, voltar ao onboarding pelo histórico do
navegador e concluir de novo moveria o marco. A fachada do frontend já se
comporta assim.

**Endpoint próprio, e não mais um campo no `PATCH /api/whoami`**: o `PATCH` de
hoje é `record UpdateAvatarRequest(@NotBlank String avatarUrl)`. Aceitar um
segundo campo exigiria afrouxar o `@NotBlank` e inventar semântica de "ausente
vs. nulo" num record Java, para um corpo que nunca vai ter conteúdo. Um POST sem
corpo é mais barato e não mexe no que já funciona.

### 8.3 Modelo de dados

Não é tabela nova: é uma coluna em `user_profile` (`V14__create_user_profile_table.sql`),
que já é a linha por usuário e já nasce sozinha no primeiro `GET /api/whoami`
via `GetOrCreateUserProfileUseCase`.

`V26__user_profile_onboarding.sql`, ou a próxima livre no momento — `V23` em diante estão
sendo consumidas pelos changes da seção 4 e da 3.3.

```sql
ALTER TABLE user_profile ADD COLUMN onboarding_completed_at TIMESTAMPTZ;
```

Anulável e sem default de propósito: `NULL` é "nunca concluiu". As contas que já
existem nascem com `NULL` e veem o onboarding no próximo acesso — que é o
comportamento desejado, já que nenhuma delas passou por ele.

`UserProfile` (o record em `profile/domain/`) ganha o campo e um
`withOnboardingCompleted(now)`, no mesmo formato do `withAvatarUrl` que já existe.

### 8.4 O que trocar no frontend quando o backend subir

1. `src/api/onboarding.ts`: os dois corpos viram `apiFetch` nos caminhos de 8.2.
   As assinaturas já estão nesse formato e devolvem `Promise` desde hoje.
2. `src/contexts/OnboardingContext.tsx`: nada. Ele já trata o estado
   `"loading"`, que hoje dura um tick e amanhã dura uma requisição.
3. `src/utils/onboardingStorage.ts` e o `ownerId` como chave deixam de ser
   necessários — o backend já sabe de quem é a linha pelo token.

**Nenhuma tela é reescrita.**

### 8.5 A limitação do modo atual

Em `localStorage`, "concluí o onboarding" é um fato **por aparelho**: quem se
cadastra no celular e depois entra pelo computador vê o fluxo de novo. A chave é
por `ownerId` justamente para o caso oposto — dois alunos no mesmo aparelho, que
é o laboratório da escola —, mas isso não resolve o primeiro caso, e só o
backend resolve.

Também vale registrar: a escrita é *best-effort*. Em navegador com armazenamento
bloqueado (Safari privado), `writeOnboarding` falha em silêncio e o aluno reveria
o onboarding na próxima visita. O gate lê o estado **em memória** do provider, e
não o `localStorage` direto, para que essa falha não vire um laço de redirect
dentro da mesma sessão.
