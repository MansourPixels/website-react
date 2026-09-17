# Google Workspace e o sistema de Tarefas

**Estado: integrado ao `revi-back`.** As tarefas moram no servidor, a Google Agenda é
sincronizada por ele e o material do Drive é baixado direto pelo backend. O modo
navegador continua existindo como driver (`VITE_GOOGLE_BACKEND=false`), mas não é mais
o caminho de produção — e, com a sincronização no servidor, ele não publica evento
nenhum.

**Motivação**: o Revi terminava no material. O aluno capturava, categorizava e
estudava, mas nada no app sabia que a prova de Biologia é sexta — e a única porta de
entrada de material era a câmera, o que deixava de fora o aluno cujo professor
distribui tudo por Drive. As tarefas trazem o **prazo** para dentro do produto, e a
Agenda é o que faz o lembrete tocar no celular mesmo com o Revi fechado.

> **O contrato vigente é o do backend**, em `revi-back/docs/API.md` (seções *Tasks*,
> *Google*, *Contents* e *Identity*). O que está aqui é o **porquê** de cada decisão e
> o mapa do lado do frontend; onde os dois divergirem, vale o `API.md`.

---

## 1. O que já está implementado no frontend

### A camada de acesso ao Google

Segue exatamente a forma de `src/utils/speech.ts` + `setSpeechDriver`: uma fachada
com driver trocável, registrado uma única vez no provider.

| Arquivo | Papel |
| --- | --- |
| `src/utils/googleAuth.ts` | **A fachada.** `isConfigured`, `getAuthMode`, `ensureAccessToken`, `requestConsent`, `revokeAccess`, `hasScope`, e a interface `GoogleAuthDriver`. **`setGoogleAuthDriver(driver)` é o ponto de troca.** |
| `src/utils/googleAuthDrivers/browserGis.ts` | Driver padrão: Google Identity Services token client. |
| `src/utils/googleAuthDrivers/backendProxy.ts` | **O driver de produção** (`VITE_GOOGLE_BACKEND=true`). Manda `returnTo` e `timeZone` no `authorize-url`. |
| `src/utils/googleStorage.ts` | Chave `revi:google` (`{ accessToken, expiresAt, scope }`) e o handshake de `sessionStorage`, espelhando `spotifyStorage.ts`. |
| `src/utils/googleScripts.ts` | Carregadores idempotentes, sob demanda, do GIS e do `gapi`. |
| `src/utils/googleDrive.ts` | Só o filtro de MIME types do Picker. O download virou trabalho do servidor. |
| `src/utils/googlePicker.ts` | `openDrivePicker(token)` → `DriveFileRef \| null`. Continua no navegador. |
| `src/contexts/GoogleContext.tsx` | Máquina de estados e o único lugar que registra o driver. |
| `src/components/GoogleConnectCard.tsx` | O cartão de conexão, na seção Google do Perfil. |

Drive e Agenda **nunca** sabem de onde veio o token: pedem `ensureAccessToken()`.

### Importar material do Drive

O aluno escolhe no Picker; o **servidor** busca os bytes no Drive. Eles nunca passam
pelo aparelho:

```
Picker → DriveFileRef (id, nome, tipo)
      → DialogImportFromDrive  (matéria + assunto, com atalho para criar)
      → POST /api/contents/from-drive { fileId, childFolderId }
```

Na câmera do assunto o destino já está decidido pela própria rota, então o diálogo não
aparece: `driveChildFolderId` vai direto para a importação.

**O que se perdeu, de propósito**: a sugestão da Revi IA não existe neste caminho. O
`folder-suggestion` é multipart e precisa dos bytes no navegador — exatamente o que
deixou de acontecer. Trocar a sugestão automática por dois selects foi o preço de não
baixar e resubir um PDF de 40 MB no 4G do ônibus. A câmera e o upload de arquivo
continuam com a sugestão intacta.

O botão aparece nas duas superfícies de captura — pílula acima do obturador no
ponteiro grosso (`Camera.tsx`), botão tertiary abaixo da dropzone no ponteiro fino
(`CaptureDesk.tsx`) — e **só** quando há configuração do Google no ambiente. Como as
duas são o mesmo componente, a câmera do assunto ganhou o recurso de graça.

Documento, apresentação e planilha do Google não têm bytes para baixar: o servidor os
exporta como PDF. A lista de MIME types em `googleDrive.ts` existe só para o Picker não
oferecer um arquivo que a importação recusaria depois — o servidor revalida, porque
esconder não é validar.

### Tarefas

| Arquivo | Papel |
| --- | --- |
| `src/types/Task.ts` | O tipo de domínio. |
| `src/api/tasks.ts` | As chamadas a `/api/tasks`, incluindo `createClassroomTask` e `requestTaskSync`. |
| `src/utils/tasks.ts` | `isOverdue`, puro e testado. É o que sobrou de `tasksStorage.ts`. |
| `src/routes/(private)/tarefas/` | A tela: `index.tsx`, `DialogFormTarefa`, `TarefaRow`, `DialogTarefaExclusion`. |

A rota `/tarefas` é alcançada pela Trilha e pelo Perfil, e entra em
`extraBottomNavigationRoutes` — **não** é uma sétima aba.

Estados cobertos: carregando, erro com `reloadKey`/retry, vazio com saída,
**Atrasadas** (derivado do relógio, nunca persistido), **Próximas**, **Concluídas**
(recolhida), sincronizada, falha de sincronização com "Tentar de novo" na própria
linha, e a faixa opcional de sincronizar em lote — sempre por clique.

A lista traz também as entregas das turmas do aluno, com o nome da turma na linha.
Editar e excluir aparecem conforme o papel: a tela cruza `classroomId` com o
`listClassrooms()` para não oferecer um botão que o servidor recusaria. Concluir fica
sempre disponível — a conclusão é de cada membro, inclusive do leitor.

**A resposta de toda mutação diz `syncState: "local"`**, porque o servidor publica na
Agenda depois de responder. A tela espera a fila assentar (`SYNC_SETTLE_MS`) e relê a
lista, em vez de pintar um "sincronizada" que talvez não tenha acontecido.

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

> **Implementados.** O que segue descreve o que foi pedido e por quê; o contrato de
> verdade, com códigos de erro e limites, está em `revi-back/docs/API.md`. Duas
> divergências do plano original valem registro:
>
> - **`syncState` e `googleEventId` são por pessoa**, não por tarefa: dois membros da
>   mesma turma veem estados diferentes para a mesma entrega.
> - **A publicação é incondicional.** O servidor enfileira a sincronização em toda
>   criação e edição; não há opção por tarefa. Quem não tem Google conectado fica em
>   `local`, e isso não é falha.

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

## 6. O que mudou no frontend na integração

1. `.env`: `VITE_GOOGLE_BACKEND=true`, e o `VITE_GOOGLE_CLIENT_SECRET` que estava ali
   **saiu** — o secret é do backend, e tudo que é `VITE_*` vai para o bundle.
2. `backendProxy.ts`: manda `timeZone` junto do `returnTo` no `authorize-url`.
3. `src/api/tasks.ts` e `src/api/onboarding.ts`: cada corpo virou `apiFetch`. O
   `ownerId` como parâmetro sumiu — o token já diz de quem é a linha.
4. **Saíram**: `taskCalendar.ts`, `googleCalendar.ts`, `tasksStorage.ts`,
   `onboardingStorage.ts`, `setTaskSync`, `downloadDriveFile` e `issueForStatus`. O
   `isOverdue` migrou para `src/utils/tasks.ts`.
5. `src/routes/(google)/callback/`: os três erros do redirect (`access_denied`,
   `invalid_state`, `no_refresh_token`) passaram a ter mensagens distintas. Dizer
   "você cancelou" para um `no_refresh_token` manda o aluno repetir o que falhou.

**Duas telas mudaram de comportamento**, e as duas por honestidade:

- **O switch "Adicionar ao Google Agenda" saiu do `DialogFormTarefa`.** A publicação é
  incondicional no servidor, então o interruptor não ligava mais nada. No lugar ficou a
  frase que diz o que vai acontecer.
- **A importação do Drive ganhou o `DialogImportFromDrive`.** Sem os bytes no aparelho
  não há sugestão da Revi IA; o destino passou a ser escolhido, com atalho para criar
  matéria e assunto ali mesmo.

`openDrivePicker` continua no navegador, e `VITE_GOOGLE_API_KEY`/`VITE_GOOGLE_APP_ID`
continuam necessários: o Picker roda no aparelho do aluno nos dois modos.

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
   `DELETE /api/google/connection` revoga em `https://oauth2.googleapis.com/revoke`. O
   `clearGoogleTokens()` do `signOut` continua, mas agora limpa só o **cache** do access
   token neste aparelho. O texto do `DialogSignOut` e o `GoogleConnectCard` foram
   ajustados para dizer isso — antes prometiam o contrário.
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
9. **Tarefa de turma — entregue.** `tasks` ganhou `classroom_id`, e `done`/`syncState`
   saíram de `tasks` para tabelas por par (tarefa, pessoa). Dono e editor criam pelo
   `POST /api/classrooms/{id}/tasks` — no frontend, o botão "Marcar entrega" na página da
   turma. Cada membro conclui a sua e recebe o evento na **própria** agenda.
10. **Quantas contas por usuário.** `uq_google_accounts_owner` assume uma. Aluno com
    conta pessoal e conta da escola vai querer escolher qual agenda recebe a entrega.
    Continua em aberto.
11. **A sugestão da Revi IA não alcança o Drive — em aberto.** O `folder-suggestion` é
    multipart e o import server-side não tem bytes para mandar. Resolver de verdade
    pede um `POST /api/contents/{id}/folder-suggestion` que rode sobre o material já
    importado, ou uma sugestão assíncrona depois do `201`. Por ora, o aluno escolhe.
12. **O relógio do `settleSync` é uma aposta.** Reler a lista 2,5 s depois cobre a fila
    no caso comum, não no ruim. A saída honesta seria o servidor avisar (SSE ou
    WebSocket); enquanto não avisa, o selo certo aparece na próxima visita à tela.

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

### 8.4 O que mudou no frontend na integração

1. `src/api/onboarding.ts`: `getOnboardingState()` lê o `onboardingCompletedAt` do
   `GET /api/whoami` (não há endpoint de leitura próprio, e nem precisa);
   `completeOnboarding()` é o `POST /api/whoami/onboarding`. O `ownerId` saiu das duas
   assinaturas.
2. `src/contexts/OnboardingContext.tsx`: nada de forma. O `"loading"` que durava um
   tick agora dura uma requisição, e já era tratado. O `ownerId` ficou só como gatilho
   do efeito — trocar de conta no mesmo aparelho precisa reabrir a pergunta.
3. `src/utils/onboardingStorage.ts` foi removido, com o teste dele.

**Nenhuma tela foi reescrita**, e a limitação de 8.5 deixou de existir: quem se
cadastra no celular não revê o onboarding no computador.

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
