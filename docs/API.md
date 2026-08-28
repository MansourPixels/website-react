# revi_back API

Referência rápida de todos os endpoints REST. Para documentação interativa com esquemas de
request/response ao vivo, rode a aplicação e abra `/swagger-ui/index.html` (veja o
`CLAUDE.md` para saber como rodá-la). Para uma coleção mais completa e pronta para uso,
importe `./postman/revi_back.postman_collection.json` no seu Postman.

## Base URL

Ambiente local (via `docker compose up`): `http://localhost:8080`

## Autenticação

Todo endpoint sob `/api/**` exige um JWT emitido pelo Keycloak como bearer token:

```
Authorization: Bearer <access_token>
```

Obtenha um token do Keycloak (realm de dev local `revi`, client `revi-api-test-client`):

```bash
curl -X POST http://localhost:8081/realms/revi/protocol/openid-connect/token \
  -d "grant_type=client_credentials" \
  -d "client_id=revi-api-test-client" \
  -d "client_secret=revi-api-test-secret"
```

Ou use a própria API do `revi_back` (veja **Auth** abaixo) — sem precisar falar com o
Keycloak: `POST /api/auth/register` devolve um access token funcional para uma conta nova, e
`POST /api/auth/login` devolve um para uma conta existente. Quando um access token expira,
`POST /api/auth/refresh` troca o refresh token de qualquer um desses por um par novo.

A claim `sub` do token vira o `ownerId` de quem chama. Todo recurso abaixo é restrito ao
dono que o criou — uma requisição para um recurso de outro dono retorna `404 Not Found` (não
`403`), de modo que a posse nunca vaza como "existe mas é proibido" versus "não existe".

Caminhos públicos, sem autenticação: `/actuator/health`, `/v3/api-docs/**`,
`/swagger-ui/**`, `/api/auth/register`, `/api/auth/forgot-password`, `/api/auth/login`,
`/api/auth/refresh`, `/api/auth/logout`.

## Formato de erro

Todos os erros são JSON `ProblemDetail` no formato RFC 7807:

```json
{ "status": 400, "detail": "Question text must not be blank" }
```

| Status HTTP | Significado |
|---|---|
| `400 Bad Request` | Falha de validação (entrada inválida) |
| `401 Unauthorized` | Credenciais erradas, ou um refresh token inválido/expirado/revogado |
| `404 Not Found` | O recurso não existe, ou existe mas não pertence a quem chama |
| `409 Conflict` | Nome duplicado, ou a pré-condição de uma operação não foi atendida |
| `500 Internal Server Error` | Falha inesperada no servidor |

## Endpoints

### Auth

Criação de conta self-service, verificação/recuperação de e-mail e gerenciamento de sessão
— tudo isso é sustentado pelo Keycloak, mas nunca é exposto ao cliente. `register`,
`forgot-password`, `login`, `refresh` e `logout` são os únicos caminhos `/api/**` sem
autenticação (veja **Autenticação** acima) — nenhum deles pode exigir um access token válido
no momento, já que é exatamente isso que existem para obter, renovar ou encerrar.

| Método | Caminho | Descrição |
|---|---|---|
| `POST` | `/api/auth/register` | Cria uma conta; já efetua login automaticamente |
| `POST` | `/api/auth/forgot-password` | Solicita um e-mail de redefinição de senha |
| `POST` | `/api/auth/resend-verification-email` | Reenvia o e-mail de verificação da própria conta de quem chama |
| `POST` | `/api/auth/login` | Troca e-mail/senha por um novo par de tokens |
| `POST` | `/api/auth/refresh` | Troca um refresh token por um novo par de tokens |
| `POST` | `/api/auth/logout` | Revoga um refresh token, encerrando a sessão |

**Corpo da requisição de registro**
```json
{ "email": "person@example.com", "username": "person92", "password": "correct-horse-battery" }
```
`email`: obrigatório, endereço bem formado. `username`: obrigatório, 3–30 caracteres,
letras/dígitos/`_`/`-`, deve começar com letra ou dígito. `password`: obrigatório, mínimo de
8 caracteres. O login continua sendo apenas e-mail+senha — `username` não é uma credencial
de login.

**Resposta do registro** (`201`) — os tokens são reais e utilizáveis imediatamente, sem
precisar de uma chamada de login separada:
```json
{
  "id": "0198...",
  "email": "person@example.com",
  "username": "person92",
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresIn": 300
}
```
Um e-mail de verificação é enviado em melhor esforço após o sucesso; uma falha de entrega
não afeta a resposta acima.

**Corpo da requisição de forgot-password**
```json
{ "email": "person@example.com" }
```
Sempre responde `202 Accepted`, independentemente de o e-mail ter ou não uma conta
associada — a resposta nunca revela quais e-mails estão cadastrados.

**Resend-verification-email**: sem corpo; autenticado. Reenvia para a própria conta de quem
chama (resolvida a partir do bearer token, não da requisição). Responde `202 Accepted`.

**Corpo da requisição de login**
```json
{ "email": "person@example.com", "password": "correct-horse-battery" }
```

**Corpo da requisição de refresh**
```json
{ "refreshToken": "eyJ..." }
```

**Resposta de login/refresh** (`200`) — mesmo formato de par de tokens da resposta do
registro, sem `id`/`email`:
```json
{ "accessToken": "eyJ...", "refreshToken": "eyJ...", "expiresIn": 300 }
```
Refresh tokens são de uso único: ao renovar, um novo refresh token entra em vigor e o que
acabou de ser usado deixa de funcionar.

**Corpo da requisição de logout**
```json
{ "refreshToken": "eyJ..." }
```
Revoga o token e responde `204 No Content` — da mesma forma, esteja o token ainda válido ou
não, então é sempre seguro chamar logout mais de uma vez.

Erros: `400` e-mail malformado, username malformado, ou senha curta demais (somente no
register) · `409` e-mail já cadastrado ou username já em uso (somente no register) · `401`
não autenticado (somente no resend-verification-email), credenciais erradas (somente no
login), ou refresh token inválido/expirado/já usado (somente no refresh).

### Quem sou eu

| Método | Caminho | Descrição |
|---|---|---|
| `GET` | `/api/whoami` | Retorna o `ownerId` resolvido de quem chama |

### Pastas Mãe

| Método | Caminho | Descrição |
|---|---|---|
| `POST` | `/api/mother-folders` | Cria uma pasta mãe |
| `GET` | `/api/mother-folders` | Lista as pastas mãe de quem chama |
| `PATCH` | `/api/mother-folders/{id}` | Renomeia e/ou recolore uma pasta mãe própria |
| `DELETE` | `/api/mother-folders/{id}` | Exclui uma pasta mãe própria, em cascata para tudo que está dentro dela |

**Corpo da requisição de criação**
```json
{ "name": "Cálculo I", "color": "#6b7280" }
```
`name`: obrigatório, 1–255 caracteres, não em branco. `color`: obrigatório, string hex
`#RRGGBB` — um valor livre (o seletor de cor do frontend é livre; não há paleta fixa).

**Corpo da requisição de atualização** — pelo menos um entre `name`/`color` deve ser
informado
```json
{ "name": "Cálculo II", "color": "#ff0000" }
```

**Resposta** (create/list/update, `201`/`200`)
```json
{ "id": "0198...", "name": "Cálculo I", "color": "#6b7280", "amount": 0 }
```
`amount`: número de pastas filhas dentro dessa pasta mãe (`0` na criação, calculado na
leitura para list/update).

Erros: `400` nome em branco/longo demais, formato de cor ausente/inválido, ou nenhum campo
informado na atualização · `404` pasta não pertence a quem chama (update/delete) · `409`
nome duplicado para esse dono.

**Semântica de exclusão**: remove a pasta mãe e tudo que está dentro dela — cada pasta
filha e, para cada uma: seu conteúdo, as questões do quiz, o resumo da pasta e os
flashcards, tanto as linhas do banco de dados (via foreign keys em cascata) quanto os
objetos correspondentes no MinIO (excluídos antes das linhas do banco, para que as chaves
de armazenamento ainda estejam legíveis nesse momento). Retorna `204 No Content`.

### Pastas Filhas

| Método | Caminho | Descrição |
|---|---|---|
| `POST` | `/api/mother-folders/{motherFolderId}/child-folders` | Cria uma pasta filha sob uma pasta mãe própria |
| `GET` | `/api/mother-folders/{motherFolderId}/child-folders` | Lista as pastas filhas de uma pasta mãe |
| `PATCH` | `/api/child-folders/{id}` | Renomeia uma pasta filha própria |
| `DELETE` | `/api/child-folders/{id}` | Exclui uma pasta filha própria, em cascata para tudo que está dentro dela |

**Corpo da requisição de criação/atualização** — pastas filhas não têm cor
```json
{ "name": "Semana 1" }
```

**Resposta** (create/list/update)
```json
{ "id": "0198...", "name": "Semana 1", "motherFolderId": "0198..." }
```

Erros: `400` nome em branco/longo demais · `404` pasta não pertence a quem chama · `409`
nome duplicado dentro da mesma pasta mãe.

**Semântica de exclusão**: remove a pasta filha e tudo que está dentro dela — conteúdo,
questões do quiz, resumo da pasta e flashcards — tanto as linhas do banco de dados (foreign
keys em cascata) quanto os objetos correspondentes no MinIO. Retorna `204 No Content`.

### Conteúdo

| Método | Caminho | Descrição |
|---|---|---|
| `POST` | `/api/child-folders/{childFolderId}/contents` | Envia um PDF ou imagem (`multipart/form-data`) |
| `GET` | `/api/child-folders/{childFolderId}/contents` | Lista os itens de conteúdo de uma pasta filha |
| `GET` | `/api/contents/{id}/download-url` | Obtém uma URL de download pré-assinada de curta duração |
| `POST` | `/api/contents/folder-suggestion` | Sugere um pareamento de pasta para um arquivo avulso, antes do upload (`multipart/form-data`) |

**Upload** — campos multipart:
- `file`: o PDF ou imagem (`.pdf`, `.jpg`/`.jpeg`, `.png`)
- `contentType`: `PDF` ou `IMAGE` — deve corresponder à extensão do arquivo

**Resposta** (upload/list)
```json
{
  "id": "0198...",
  "name": "notes.pdf",
  "contentType": "PDF",
  "childFolderId": "0198...",
  "hasSummary": false
}
```
`hasSummary` vira `true` assim que o pipeline assíncrono de categorização (RabbitMQ + Groq
para OCR, OpenAI para o resumo do texto em si) termina de resumir o arquivo — geralmente em
poucos segundos. No momento em que isso acontece, o quiz, o resumo agregado, os flashcards e
o mapa mental (veja abaixo) da pasta filha se regeneram automaticamente em segundo plano —
não é preciso nenhuma chamada separada para atualizar nenhum deles.

**Resposta da URL de download**
```json
{ "url": "http://localhost:9000/revi-content/owners/.../notes.pdf?X-Amz-..." }
```

Erros: `400` a extensão do arquivo não corresponde ao `contentType` · `404` pasta filha não
pertence a quem chama (upload/list) ou conteúdo não pertence a quem chama (download-url).

**Folder suggestion** — síncrono, não persiste nada (não é um upload). Os campos multipart
são os mesmos do upload (`file`, `contentType`). Faz OCR/extrai o texto do arquivo e o
compara com as pastas mãe/filhas do próprio chamador.

**Resposta com correspondência**
```json
{
  "matched": true,
  "motherFolderId": "0198...",
  "childFolderId": "0198...",
  "suggestedMotherFolderName": null,
  "suggestedChildFolderName": null
}
```

**Resposta sem correspondência** (nenhuma pasta existente corresponde plausivelmente, ou
quem chama ainda não tem pastas)
```json
{
  "matched": false,
  "motherFolderId": null,
  "childFolderId": null,
  "suggestedMotherFolderName": "Física I",
  "suggestedChildFolderName": "Cinemática"
}
```

Erros: `400` `contentType` não suportado/inválido (nenhuma chamada de IA é feita) · `401`
não autenticado.

### Quiz

As questões do quiz são geradas de forma assíncrona (RabbitMQ + OpenAI) a partir do
conteúdo resumido de uma pasta filha, então uma pasta precisa de pelo menos um arquivo
enviado com `hasSummary: true` antes que um quiz exista. Como visto em **Conteúdo** acima,
um quiz se regenera automaticamente no momento em que um novo conteúdo é resumido — o
`/generate` só é necessário para uma atualização sob demanda (por exemplo, para forçar novas
questões sem adicionar conteúdo).

| Método | Caminho | Descrição |
|---|---|---|
| `GET` | `/api/child-folders/{childFolderId}/quiz` | Lista as questões atuais do quiz |
| `POST` | `/api/child-folders/{childFolderId}/quiz/generate` | Força uma regeneração assíncrona |
| `POST` | `/api/child-folders/{childFolderId}/quiz/grade` | Corrige um conjunto de respostas enviado |

Uma varredura periódica em segundo plano também pega qualquer regeneração que o gatilho
automático tenha perdido, mas ela só regenera um quiz que esteja genuinamente desatualizado
em relação ao conteúdo da pasta — diferente do `/generate`, que sempre força um novo lote
mesmo que o quiz já esteja em dia.

**Resposta de listagem** — `correctOption` é omitido de propósito; chame `/grade` em vez de
inspecioná-lo no cliente.
```json
[
  {
    "id": "0198...",
    "position": 0,
    "question": "Qual é a principal função da clorofila nas plantas?",
    "optionA": "Armazenar água nas células",
    "optionB": "Absorver luz solar",
    "optionC": "Produzir oxigênio diretamente",
    "optionD": "Distribuir nutrientes pelo caule"
  }
]
```

**Generate**: sem corpo. Responde `202 Accepted` sem corpo — depois disso, faça polling em
`GET .../quiz`. `409 Conflict` se a pasta filha ainda não tiver conteúdo resumido.

**Corpo da requisição de grade** — um array JSON puro, uma entrada por questão respondida:
```json
[
  { "questionId": "0198...", "selectedOption": "B" },
  { "questionId": "0198...", "selectedOption": "A" }
]
```
Um `questionId` omitido é pontuado como incorreto; a pontuação cobre toda questão
persistida, não só as enviadas.

**Resposta do grade**
```json
{
  "results": [
    { "questionId": "0198...", "correct": true },
    { "questionId": "0198...", "correct": false }
  ],
  "correctCount": 1,
  "totalQuestions": 2
}
```
Um grade bem-sucedido também persiste uma tentativa de quiz (dono, pasta filha, pasta mãe,
quantidade de acertos, total de questões, timestamp) que alimenta os endpoints de
**Desempenho** abaixo — isso não muda em nada a resposta acima.

Erros: `404` pasta filha não pertence a quem chama (nos três endpoints) · `409` ainda sem
conteúdo resumido (somente no generate).

### Desempenho

Precisão agregada do quiz derivada de cada tentativa persistida por `POST .../quiz/grade`
(veja **Quiz** acima). Calculada na leitura via consultas agrupadas — sem contadores
incrementais.

| Método | Caminho | Descrição |
|---|---|---|
| `GET` | `/api/performance/overview` | Precisão geral em todas as tentativas de quiz de quem chama |
| `GET` | `/api/performance/by-discipline` | Precisão detalhada por pasta mãe ("disciplina") |

**Resposta de overview**
```json
{
  "totalAttempts": 12,
  "totalQuestions": 240,
  "totalCorrectAnswers": 198,
  "accuracyPercentage": 82.5
}
```
Todos os campos são `0` para quem ainda não tem tentativas corrigidas — não é um erro.

**Resposta de by-discipline** — uma entrada por pasta mãe com pelo menos uma tentativa em
qualquer uma das suas pastas filhas; uma pasta mãe com zero tentativas é omitida por
completo
```json
[
  {
    "motherFolderId": "0198...",
    "motherFolderName": "Cálculo I",
    "totalAttempts": 5,
    "totalQuestions": 100,
    "totalCorrectAnswers": 91,
    "accuracyPercentage": 91.0
  }
]
```
Se a pasta mãe tiver sido excluída depois, `motherFolderName` reporta `"(pasta excluída)"`
— as tentativas continuam contando (excluir uma pasta não apaga o histórico de estudo).

Nenhuma resposta de erro além do `401` padrão para token ausente/inválido.

### Trilha (Plano de Estudos)

Um plano de estudos gerado e priorizado, construído a partir da precisão por disciplina do
**Desempenho** (veja acima). A geração é assíncrona (RabbitMQ) e determinística — sem
chamada de IA, sem aleatoriedade por usuário. Por padrão, classifica as pastas mãe
("disciplinas") de quem chama em ordem crescente de precisão, excluindo disciplinas sem
tentativas ou cujas únicas pastas filhas foram excluídas; as 3 mais fracas são mantidas,
cada uma tendo como alvo sua própria pasta filha de pior desempenho. Quem chama pode, em vez
disso, indicar até 3 disciplinas próprias para ter como alvo diretamente (veja **Generate**
abaixo) — qualquer disciplina própria é elegível, inclusive uma sem nenhuma tentativa de
quiz ainda. Cada disciplina selecionada (automática ou manual) contribui com uma sequência
fixa de 4 passos: revisar o resumo da pasta, revisar seus flashcards, revisar seu mapa
mental, refazer seu quiz. O plano é persistido — regenerar o substitui por completo,
reiniciando o progresso de conclusão.

| Método | Caminho | Descrição |
|---|---|---|
| `POST` | `/api/study-plan/generate` | Solicita uma regeneração assíncrona do plano de quem chama |
| `GET` | `/api/study-plan` | Obtém o plano atual de quem chama |
| `PATCH` | `/api/study-plan/steps/{stepId}/complete` | Marca um dos próprios passos de quem chama como concluído |

**Generate**: corpo opcional `{ "motherFolderIds": ["<uuid>", ...] }`. Corpo ausente/`null`,
`null`, ou um `motherFolderIds` vazio reproduzem a classificação automática das 3 mais
fracas acima. Um `motherFolderIds` não vazio (1 a 3 ids de pastas mãe próprias) faz o plano
ter exatamente essas disciplinas como alvo, na ordem informada; duplicatas são removidas
silenciosamente. Uma disciplina ainda sem dados de precisão de quiz recorre à sua pasta
filha própria de menor id. Uma disciplina selecionada sem nenhuma pasta filha própria é
ignorada, sem substituição. Responde `202 Accepted` sem corpo — depois disso, faça polling
em `GET /api/study-plan` (`generatedAt` reflete a geração completa mais recente). Erros:
`400` se mais de 3 ids distintos forem informados (nada é enfileirado); `404` se algum id
informado não for uma pasta mãe própria (nada é enfileirado).

**Resposta do get** — `generatedAt` é `null` e `steps` fica vazio se quem chama nunca gerou
um plano; uma geração que não encontra nenhuma disciplina elegível ainda (por exemplo, sem
tentativas de quiz) define `generatedAt` com uma lista `steps` vazia.
```json
{
  "generatedAt": "2026-08-26T16:08:10.270622Z",
  "steps": [
    {
      "id": "0198...",
      "stepType": "REVIEW_SUMMARY",
      "motherFolderId": "0198...",
      "motherFolderName": "Cálculo I",
      "childFolderId": "0198...",
      "childFolderName": "Semana 1",
      "completed": false,
      "completedAt": null
    },
    { "stepType": "REVIEW_FLASHCARDS", "...": "..." },
    { "stepType": "REVIEW_MIND_MAP", "...": "..." },
    { "stepType": "RETAKE_QUIZ", "...": "..." }
  ]
}
```
`stepType` é um de `REVIEW_SUMMARY`, `REVIEW_FLASHCARDS`, `REVIEW_MIND_MAP`, `RETAKE_QUIZ` —
o frontend faz deep-link para a tela existente de resumo/flashcards/mapa-mental/quiz daquele
passo, usando `childFolderId`. Se a pasta mãe ou filha de um passo tiver sido excluída desde
que o plano foi gerado, seu nome reporta `"(pasta excluída)"` em vez de gerar erro ou omitir
o passo.

**Complete step**: sem corpo. Responde `204 No Content`. `404` se o passo não existir ou
pertencer ao plano de outro dono.

Erros: `401` token ausente/inválido (nos três endpoints) · `404` passo não encontrado/não
pertence a quem chama (somente no complete-step).

### Resumo da Pasta

Um resumo agregado em Markdown de tudo que está atualmente resumido em uma pasta filha,
gerado de forma assíncrona (RabbitMQ + OpenAI) no momento em que o conteúdo é enviado — não
existe endpoint manual de geração/atualização; ele sempre acompanha o conteúdo da pasta
automaticamente, da mesma forma que o quiz e os flashcards.

| Método | Caminho | Descrição |
|---|---|---|
| `GET` | `/api/child-folders/{childFolderId}/summary` | Obtém o resumo agregado atual |

**Resposta**
```json
{
  "markdown": "## Resumo Consolidado\n\n- RabbitMQ é um broker de mensagens...",
  "generatedAt": "2026-08-26T16:08:10.270622Z"
}
```

Erros: `404` pasta filha não pertence a quem chama, ou nenhum resumo foi gerado ainda (por
exemplo, nenhum conteúdo enviado, ou categorização ainda em andamento).

### Flashcards

Flashcards de estudo frente/verso gerados a partir do mesmo conteúdo resumido e do mesmo
gatilho automático do Resumo da Pasta — também não há endpoint manual de geração/atualização
aqui.

| Método | Caminho | Descrição |
|---|---|---|
| `GET` | `/api/child-folders/{childFolderId}/flashcards` | Lista os flashcards atuais |

**Resposta** — `200` com um array vazio se nenhum foi gerado ainda (por exemplo, nenhum
conteúdo enviado, ou categorização ainda em andamento):
```json
[
  { "id": "0198...", "position": 0, "front": "O que é RabbitMQ?", "back": "Um broker de mensagens open-source." }
]
```

Erros: `404` pasta filha não pertence a quem chama.

### Mapa Mental

Uma árvore de conceitos (nó raiz + ramos aninhados, até 4 níveis de profundidade) gerada a
partir do mesmo conteúdo resumido e do mesmo gatilho automático do Resumo da Pasta e dos
Flashcards — também não há endpoint manual de geração/atualização aqui.

| Método | Caminho | Descrição |
|---|---|---|
| `GET` | `/api/child-folders/{childFolderId}/mind-map` | Obtém o mapa mental atual |

**Resposta** — `200` com `raiz`/`generatedAt` nulos se nenhum foi gerado ainda (por exemplo,
nenhum conteúdo enviado, ou categorização ainda em andamento); `assunto` sempre reflete o
nome atual da pasta filha:
```json
{
  "assunto": "Semana 1",
  "raiz": {
    "id": "cubica",
    "label": "Equação do 3º grau",
    "detalhe": "Com a ≠ 0.",
    "formula": "ax³ + bx² + cx + d = 0",
    "children": [
      { "id": "coeficientes", "label": "Coeficientes", "detalhe": "...", "formula": null, "children": [] }
    ]
  },
  "generatedAt": "2026-08-26T16:08:10.270622Z"
}
```

Erros: `404` pasta filha não pertence a quem chama.

### Ofensiva (Streak)

Uma ofensiva diária de engajamento ("streak"), calculada na leitura (sem contador
persistido, sem job em segundo plano): quatro ações contam — enviar conteúdo, ler um resumo
de pasta existente, ler uma lista de flashcards não vazia, e corrigir um quiz. Realizar
qualquer uma delas mantém/avança a ofensiva do dia; realizar **as quatro** no mesmo dia do
calendário torna esse dia "dourado" ("gold"). O corte do dia usa o fuso horário fixo
`America/Sao_Paulo` para todas as contas (não existe configuração de fuso por usuário). O
registro é inteiramente automático e feito no servidor — as quatro ações acima se registram
sozinhas quando bem-sucedidas; não existe endpoint para reportar uma ação manualmente.

| Método | Caminho | Descrição |
|---|---|---|
| `GET` | `/api/streak` | Obtém o status da ofensiva de quem chama, contagens de dias e o checklist de hoje |
| `GET` | `/api/streak/calendar` | Obtém o status de atividade dia a dia de um mês do calendário |

**Resposta** (`GET /api/streak`)
```json
{
  "currentStreak": 5,
  "recordStreak": 12,
  "daysThisMonth": 8,
  "daysActiveThisWeek": 4,
  "todayIsGold": false,
  "today": { "upload": true, "summary": true, "flashcards": false, "quiz": false }
}
```
`currentStreak`: dias consecutivos (até hoje ou ontem) com pelo menos uma ação qualificada —
veja a regra de congelamento abaixo para entender o que "consecutivo" tolera.
`recordStreak`: a maior sequência desse tipo em todo o histórico da conta (nunca menor que
`currentStreak`). `daysThisMonth`: dias ativos distintos no mês corrente do calendário.
`daysActiveThisWeek`: dias ativos distintos nos últimos 7 dias do calendário, incluindo hoje
(uma janela móvel fixa, não uma semana ISO). `todayIsGold`: `true` somente quando as quatro
entradas do checklist de hoje forem `true`. Condições exatas de qualificação por ação:
- **upload**: qualquer `POST .../contents` bem-sucedido hoje (PDF ou imagem).
- **summary**: um `GET .../summary` bem-sucedido hoje (um `404` — nada gerado ainda — não
  conta).
- **flashcards**: um `GET .../flashcards` bem-sucedido hoje que retorna uma lista não vazia
  (uma lista vazia não conta).
- **quiz**: um `POST .../quiz/grade` bem-sucedido hoje (listar questões via `GET .../quiz`
  não conta — só a correção conta).

**Congelamento automático da ofensiva**: cada mês do calendário perdoa automaticamente o
*primeiro* dia totalmente inativo que encontrar enquanto uma ofensiva está em andamento —
esse dia conta para a ofensiva como se tivesse tido atividade, em vez de zerá-la. Um segundo
dia inativo no mesmo mês do calendário não é perdoado e quebra a ofensiva normalmente.
Congelamentos não usados não são levados para o mês seguinte, e um congelamento nunca é
concedido a um dia inativo isolado sem nenhuma ofensiva em andamento para proteger. Isso
vale tanto para `currentStreak` quanto para `recordStreak`.

Nenhuma resposta de erro além do `401` padrão para token ausente/inválido — não há
verificação de posse (a ofensiva é por conta, não por pasta) e nenhum caso de não encontrado
(uma conta com zero atividade simplesmente reporta uma ofensiva de `0`).

**Resposta** (`GET /api/streak/calendar?month=2026-08`, `month` opcional, padrão é o mês
atual, formato `YYYY-MM`)
```json
[
  { "date": "2026-08-01", "status": "GOLD" },
  { "date": "2026-08-02", "status": "PARTIAL" },
  { "date": "2026-08-03", "status": "FROZEN" },
  { "date": "2026-08-04", "status": "NONE" }
]
```
Uma entrada por dia, do dia 1º do mês solicitado até o que vier primeiro entre o último dia
daquele mês ou hoje — um mês inteiramente no futuro retorna um array vazio. `status` é um de
`NONE` (sem atividade, não perdoado), `PARTIAL` (algumas, mas não todas as quatro ações
qualificadas), `GOLD` (as quatro), ou `FROZEN` (o congelamento automático daquele mês
perdoou esse dia que, de outra forma, seria inativo).

Erros: `400` valor de `month` malformado · `401` não autenticado.
