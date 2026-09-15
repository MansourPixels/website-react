# revi_back API

Quick reference for every REST endpoint. For interactive docs with live request/response
schemas, run the app and open `/swagger-ui/index.html` (see `CLAUDE.md` for how to run it).
For a richer, ready-to-run collection, import `postman/revi_back.postman_collection.json`.

## Base URL

Local dev (via `docker compose up`): `http://localhost:8080`

## Authentication

Every endpoint under `/api/**` requires a Keycloak-issued JWT as a bearer token:

```
Authorization: Bearer <access_token>
```

Get a token from Keycloak (local dev realm `revi`, client `revi-api-test-client`):

```bash
curl -X POST http://localhost:8081/realms/revi/protocol/openid-connect/token \
  -d "grant_type=client_credentials" \
  -d "client_id=revi-api-test-client" \
  -d "client_secret=revi-api-test-secret"
```

Or use `revi_back`'s own API (see **Auth** below) — no need to talk to Keycloak at all:
`POST /api/auth/register` returns a working access token for a new account, and
`POST /api/auth/login` returns one for an existing account. When an access token expires,
`POST /api/auth/refresh` trades the refresh token from either of those for a fresh pair.

The `sub` claim of the token becomes the caller's `ownerId`. Every resource below is scoped
to the owner that created it — a request for another owner's resource returns `404 Not
Found` (not `403`), so ownership is never leaked as "exists but forbidden" vs. "does not
exist".

Public, unauthenticated paths: `/actuator/health`, `/v3/api-docs/**`, `/swagger-ui/**`,
`/api/auth/register`, `/api/auth/forgot-password`, `/api/auth/login`, `/api/auth/refresh`,
`/api/auth/logout`.

## Error format

All errors are RFC 7807 `ProblemDetail` JSON:

```json
{ "status": 400, "detail": "Question text must not be blank" }
```

| HTTP status | Meaning |
|---|---|
| `400 Bad Request` | Validation failure (bad input) |
| `401 Unauthorized` | Wrong credentials, or an invalid/expired/revoked refresh token |
| `404 Not Found` | Resource doesn't exist, or exists but isn't owned by the caller |
| `409 Conflict` | Duplicate name, or an operation's precondition isn't met |
| `500 Internal Server Error` | Unexpected server-side failure |

## Endpoints

### Auth

Self-service account creation, email verification/recovery, and session management —
Keycloak backs all of it but is never exposed to the client. `register`, `forgot-password`,
`login`, `refresh`, and `logout` are the only unauthenticated `/api/**` paths (see
**Authentication** above) — none of them can require a currently-valid access token, since
that's precisely what they exist to obtain, refresh, or end.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create an account; auto-logs in |
| `POST` | `/api/auth/forgot-password` | Request a password-reset email |
| `POST` | `/api/auth/resend-verification-email` | Resend the caller's own verification email |
| `POST` | `/api/auth/login` | Exchange email/password for a fresh token pair |
| `POST` | `/api/auth/refresh` | Exchange a refresh token for a fresh token pair |
| `POST` | `/api/auth/logout` | Revoke a refresh token, ending the session |

**Register request body**
```json
{ "email": "person@example.com", "username": "person92", "password": "correct-horse-battery" }
```
`email`: required, well-formed address. `username`: required, 3–30 characters, letters/
digits/`_`/`-`, must start with a letter or digit. `password`: required, minimum 8
characters. Login stays email+password only — `username` is not a login credential.

**Register response** (`201`) — the tokens are real and immediately usable, no separate
login call needed:
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
A best-effort verification email is sent on success; a delivery failure does not affect the
response above.

**Forgot-password request body**
```json
{ "email": "person@example.com" }
```
Always responds `202 Accepted`, whether or not the email has an associated account — the
response never reveals which emails are registered.

**Resend-verification-email**: no body; authenticated. Resends to the caller's own account
(resolved from the bearer token, not the request). Responds `202 Accepted`.

**Login request body**
```json
{ "email": "person@example.com", "password": "correct-horse-battery" }
```

**Refresh request body**
```json
{ "refreshToken": "eyJ..." }
```

**Login/refresh response** (`200`) — same token-pair shape as register's response, minus
`id`/`email`:
```json
{ "accessToken": "eyJ...", "refreshToken": "eyJ...", "expiresIn": 300 }
```
Refresh tokens are single-use: refreshing rotates in a new refresh token, and the one just
used stops working.

**Logout request body**
```json
{ "refreshToken": "eyJ..." }
```
Revokes the token and responds `204 No Content` — identically whether or not that token was
still valid, so logout is always safe to call more than once.

Errors: `400` malformed email, malformed username, or too-short password (register only) ·
`409` email already registered or username already taken (register only) · `401`
unauthenticated (resend-verification-email only), wrong credentials (login only), or an
invalid/expired/already-used refresh token (refresh only).

### Who Am I

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/whoami` | Returns the caller's resolved `ownerId` and avatar URL |
| `PATCH` | `/api/whoami` | Updates the caller's avatar URL |

**Response** (`GET`, `200`)
```json
{ "ownerId": "0198...", "avatarUrl": "https://api.dicebear.com/10.x/big-smile/svg?seed=0198..." }
```
`avatarUrl` is never `null`: on an account's first `GET`, the backend generates and persists
a default avatar (a DiceBear URL seeded by the caller's `ownerId`) instead of leaving it
unset.

**Update request body**
```json
{ "avatarUrl": "https://api.dicebear.com/10.x/big-smile/svg?seed=custom" }
```
`avatarUrl`: required, non-blank, `https` only, host must be `api.dicebear.com`, at most
2048 characters. Responds `204 No Content`. Succeeds whether or not the caller already has a
stored avatar.

Errors: `400` blank avatar URL, non-`https` scheme, disallowed host, or over 2048 characters
(`PATCH` only).

### Mother Folders

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/mother-folders` | Create a mother folder |
| `GET` | `/api/mother-folders` | List the caller's mother folders |
| `PATCH` | `/api/mother-folders/{id}` | Rename and/or recolor an owned mother folder |
| `DELETE` | `/api/mother-folders/{id}` | Delete an owned mother folder, cascading to everything inside it |

**Create request body**
```json
{ "name": "Cálculo I", "color": "#6b7280" }
```
`name`: required, 1–255 characters, non-blank. `color`: required, `#RRGGBB` hex string — an
unconstrained value (the frontend's color picker is free-form; there's no fixed palette).

**Update request body** — at least one of `name`/`color` must be provided
```json
{ "name": "Cálculo II", "color": "#ff0000" }
```

**Response** (create/list/update, `201`/`200`)
```json
{ "id": "0198...", "name": "Cálculo I", "color": "#6b7280", "amount": 0 }
```
`amount`: number of child folders inside this mother folder (`0` on create, computed on
read for list/update).

Errors: `400` blank/too-long name, missing/invalid color format, or no fields provided on
update · `404` folder not owned by caller (update/delete) · `409` duplicate name for this
owner.

**Delete semantics**: removes the mother folder and everything inside it — every child
folder, and for each: its content, quiz questions, folder summary, and flashcards, both the
database rows (via cascading foreign keys) and the underlying MinIO objects (deleted before
the database rows, so storage keys are still readable at that point). Returns `204 No
Content`.

### Child Folders

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/mother-folders/{motherFolderId}/child-folders` | Create a child folder under an owned mother folder |
| `GET` | `/api/mother-folders/{motherFolderId}/child-folders` | List a mother folder's child folders |
| `PATCH` | `/api/child-folders/{id}` | Rename an owned child folder |
| `DELETE` | `/api/child-folders/{id}` | Delete an owned child folder, cascading to everything inside it |

**Create/update request body** — child folders have no color
```json
{ "name": "Semana 1" }
```

**Response** (create/list/update)
```json
{ "id": "0198...", "name": "Semana 1", "motherFolderId": "0198..." }
```

Errors: `400` blank/too-long name · `404` folder not owned by caller · `409` duplicate name
within the same mother folder.

**Delete semantics**: removes the child folder and everything inside it — content, quiz
questions, folder summary, and flashcards — both the database rows (cascading foreign keys)
and the underlying MinIO objects. Returns `204 No Content`.

### Content

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/child-folders/{childFolderId}/contents` | Upload a PDF or image (`multipart/form-data`) |
| `GET` | `/api/child-folders/{childFolderId}/contents` | List a child folder's content items |
| `GET` | `/api/contents/{id}/download-url` | Get a short-lived presigned download URL |
| `GET` | `/api/contents/{id}/text` | Get the text extracted from a content item |
| `POST` | `/api/contents/folder-suggestion` | Suggest a folder pairing for a loose file, before uploading (`multipart/form-data`) |

**Upload** — multipart fields:
- `file`: the PDF or image (`.pdf`, `.jpg`/`.jpeg`, `.png`)
- `contentType`: `PDF` or `IMAGE` — must match the file's extension

**Response** (upload/list)
```json
{
  "id": "0198...",
  "name": "notes.pdf",
  "contentType": "PDF",
  "childFolderId": "0198...",
  "hasSummary": false
}
```
`hasSummary` flips to `true` once the async categorization pipeline finishes summarizing the
file — usually within a few seconds. Images use OpenAI vision to extract text; PDFs use PDFBox
to extract their text layer, before OpenAI generates the summary. The moment that happens, the
child folder's quiz, aggregated summary, flashcards, and mind map (see below) all regenerate
automatically in the background — no separate call is needed to refresh any of them.

**Download URL response**
```json
{ "url": "http://localhost:9000/revi-content/owners/.../notes.pdf?X-Amz-..." }
```

**Extracted text response**
```json
{
  "contentId": "0198...",
  "text": "Text extracted from the material.",
  "extractedAt": "2026-09-15T12:34:56Z"
}
```
While categorization is pending, the endpoint returns `200` with `text: ""` and
`extractedAt: null`. A completed extraction without readable text also returns `text: ""`,
but has a non-null `extractedAt` value.

Errors: `400` file extension doesn't match `contentType` · `404` child folder not owned by
caller (upload/list) or content not owned by caller (download-url/text) · `401`
unauthenticated.

**Folder suggestion** — synchronous, persists nothing (not an upload). Multipart fields are
the same as upload (`file`, `contentType`). OCRs/extracts the file's text and matches it
against the caller's own mother/child folders.

**Matched response**
```json
{
  "matched": true,
  "motherFolderId": "0198...",
  "childFolderId": "0198...",
  "suggestedMotherFolderName": null,
  "suggestedChildFolderName": null
}
```

**Unmatched response** (no existing folder plausibly matches, or the caller has no
folders yet)
```json
{
  "matched": false,
  "motherFolderId": null,
  "childFolderId": null,
  "suggestedMotherFolderName": "Física I",
  "suggestedChildFolderName": "Cinemática"
}
```

Errors: `400` unsupported/invalid `contentType` (no AI call is made) · `401` unauthenticated.

### Quiz

Quiz questions are generated asynchronously (RabbitMQ + OpenAI) from a child folder's
summarized content, so a folder needs at least one uploaded file with `hasSummary: true`
before a quiz exists. As covered under **Content** above, a quiz regenerates automatically
the moment new content is summarized — `/generate` is only needed for an on-demand refresh
(e.g. to force new questions without adding content).

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/child-folders/{childFolderId}/quiz` | List the current quiz questions |
| `POST` | `/api/child-folders/{childFolderId}/quiz/generate` | Force an async regeneration |
| `POST` | `/api/child-folders/{childFolderId}/quiz/grade` | Grade a submitted set of answers |

A periodic background sweep also catches any regeneration the automatic trigger missed, but
it only ever regenerates a quiz that's genuinely behind the folder's content — unlike
`/generate`, which always forces a fresh batch even if the quiz is already up to date.

**List response** — `correctOption` is intentionally omitted; call `/grade` instead of
inspecting it client-side.
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

**Generate**: no body. Responds `202 Accepted` with no body — poll `GET .../quiz`
afterward. `409 Conflict` if the child folder has no summarized content yet.

**Grade request body** — a raw JSON array, one entry per answered question:
```json
[
  { "questionId": "0198...", "selectedOption": "B" },
  { "questionId": "0198...", "selectedOption": "A" }
]
```
An omitted `questionId` is scored as incorrect; scoring covers every persisted question,
not just the ones submitted.

**Grade response**
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
A successful grade also persists a quiz attempt (owner, child folder, mother folder,
correct count, total questions, timestamp) feeding the **Performance** endpoints below —
this doesn't change the response above in any way.

Errors: `404` child folder not owned by caller (all three endpoints) · `409` no summarized
content yet (generate only).

### Performance

Aggregate quiz accuracy derived from every attempt persisted by `POST .../quiz/grade`
(see **Quiz** above). Computed on read via grouped queries — no incremental counters.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/performance/overview` | Overall accuracy across all of the caller's quiz attempts |
| `GET` | `/api/performance/by-discipline` | Accuracy broken down by mother folder ("discipline") |

**Overview response**
```json
{
  "totalAttempts": 12,
  "totalQuestions": 240,
  "totalCorrectAnswers": 198,
  "accuracyPercentage": 82.5
}
```
All fields are `0` for a caller with no graded attempts yet — not an error.

**By-discipline response** — one entry per mother folder with at least one attempt under
any of its child folders; a mother folder with zero attempts is omitted entirely
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
If the mother folder was since deleted, `motherFolderName` reports `"(pasta excluída)"` —
the attempts still count (deleting a folder doesn't erase study history).

No error responses beyond the standard `401` for a missing/invalid token.

### Trilha (Study Plan)

A generated, prioritized study plan built from **Performance**'s per-discipline accuracy
(see above). Generation is asynchronous (RabbitMQ) and deterministic — no AI call, no
per-user randomness. By default, ranks the caller's mother folders ("disciplines") by
ascending accuracy, excluding disciplines with no attempts or whose only child folders were
deleted; the 3 weakest are kept, each targeting its own single worst-performing child folder.
The caller may instead name up to 3 owned disciplines to target directly (see **Generate**
below) — any owned discipline is eligible, including one with no quiz attempts yet. Each
selected discipline (automatic or manual) contributes a fixed 4-step sequence: review the
folder's summary, review its flashcards, review its mind map, retake its quiz. The plan is
persisted — regenerating replaces it wholesale, resetting completion progress.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/study-plan/generate` | Request an async regeneration of the caller's plan |
| `GET` | `/api/study-plan` | Get the caller's current plan |
| `PATCH` | `/api/study-plan/steps/{stepId}/complete` | Mark one of the caller's own steps completed |

**Generate**: optional body `{ "motherFolderIds": ["<uuid>", ...] }`. Missing/`null` body,
`null`, or an empty `motherFolderIds` all reproduce the automatic weakest-3 ranking above.
A non-empty `motherFolderIds` (1-3 owned mother folder ids) makes the plan target exactly
those disciplines, in the order supplied; duplicates are deduped silently. A discipline with
no quiz accuracy data yet falls back to its owned child folder with the lowest id. A
selected discipline with no owned child folder at all is skipped, with no backfill.
Responds `202 Accepted` with no body — poll `GET /api/study-plan` afterward (`generatedAt`
reflects the most recent completed generation). Errors: `400` if more than 3 distinct ids
are named (nothing enqueued); `404` if any named id is not an owned mother folder (nothing
enqueued).

**Get response** — `generatedAt` is `null` and `steps` is empty if the caller has never
generated a plan; a generation that finds no eligible discipline yet (e.g. no quiz attempts)
sets `generatedAt` with an empty `steps` list.
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
`stepType` is one of `REVIEW_SUMMARY`, `REVIEW_FLASHCARDS`, `REVIEW_MIND_MAP`,
`RETAKE_QUIZ` — the frontend deep-links into that step's existing summary/flashcards/mind-map/
quiz screen for `childFolderId`. If a step's mother or child folder was deleted since the
plan was generated, its name reports `"(pasta excluída)"` rather than erroring or omitting
the step.

**Complete step**: no body. Responds `204 No Content`. `404` if the step doesn't exist or
belongs to another owner's plan.

Errors: `401` missing/invalid token (all three endpoints) · `404` step not owned/found
(complete-step only).

### Folder Summary

An aggregated Markdown summary of everything currently summarized in a child folder,
generated asynchronously (RabbitMQ + OpenAI) the moment content is uploaded — there is no
manual generate/refresh endpoint; it always follows the folder's content automatically, the
same way quiz and flashcards do.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/child-folders/{childFolderId}/summary` | Get the current aggregated summary |

**Response**
```json
{
  "markdown": "## Resumo Consolidado\n\n- RabbitMQ é um broker de mensagens...",
  "generatedAt": "2026-08-26T16:08:10.270622Z"
}
```

Errors: `404` child folder not owned by caller, or no summary has been generated yet (e.g.
no content uploaded, or categorization still in progress).

### Flashcards

Front/back study flashcards generated from the same summarized content and the same
automatic trigger as Folder Summary — no manual generate/refresh endpoint here either.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/child-folders/{childFolderId}/flashcards` | List the current flashcards |
| `POST` | `/api/child-folders/{childFolderId}/flashcards/complete` | Record a completed flashcard review session |

**Response** — `200` with an empty array if none have been generated yet (e.g. no content
uploaded, or categorization still in progress):
```json
[
  { "id": "0198...", "position": 0, "front": "O que é RabbitMQ?", "back": "Um broker de mensagens open-source." }
]
```

**`POST .../flashcards/complete`**: no body; called when the caller finishes reviewing a
folder's flashcards. Creates one `FlashcardReview` record and responds `201`. Not
deduplicated — calling it multiple times for the same folder on the same day creates that
many separate records; each one counts toward ranking's flashcard-completion XP (see
**Ranking** below).

Errors: `404` child folder not owned by caller.

### Mind Map

A concept tree (root node + nested branches, up to 4 levels deep) generated from the same
summarized content and the same automatic trigger as Folder Summary and Flashcards — no
manual generate/refresh endpoint here either.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/child-folders/{childFolderId}/mind-map` | Get the current mind map |

**Response** — `200` with a null `raiz`/`generatedAt` if none has been generated yet (e.g. no
content uploaded, or categorization still in progress); `assunto` always reflects the child
folder's current name:
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

Errors: `404` child folder not owned by caller.

### Streak

A daily engagement streak ("ofensiva"), computed on read (no persisted counter, no
background job): four actions qualify — uploading content, reading an existing folder
summary, reading a non-empty flashcard list, and grading a quiz. Performing any one of them
keeps/advances the streak for the day; performing **all four** on the same calendar day
makes that day "gold". The day boundary is a fixed `America/Sao_Paulo` timezone for every
account (there is no per-user timezone setting). Recording is entirely automatic and
server-side — the four actions above record it themselves on success, there is no endpoint
to report an action manually.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/streak` | Get the caller's streak status, day counts, and today's checklist |
| `GET` | `/api/streak/calendar` | Get a day-by-day activity status for a calendar month |

**Response** (`GET /api/streak`)
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
`currentStreak`: consecutive days (through today or yesterday) with at least one qualifying
action — see the freeze rule below for what "consecutive" tolerates. `recordStreak`: the
longest such run anywhere in the account's history (never smaller than `currentStreak`).
`daysThisMonth`: distinct active days in the current calendar month. `daysActiveThisWeek`:
distinct active days in the last 7 calendar days including today (a fixed rolling window,
not an ISO week). `todayIsGold`: `true` only once all four of today's checklist entries are
`true`. Exact qualifying conditions per action:
- **upload**: any successful `POST .../contents` today (PDF or image).
- **summary**: a successful `GET .../summary` today (a `404` — nothing generated yet — does
  not count).
- **flashcards**: a successful `GET .../flashcards` today that returns a non-empty list (an
  empty list does not count).
- **quiz**: a successful `POST .../quiz/grade` today (listing questions via `GET .../quiz`
  does not count — only grading does).

**Automatic streak freeze**: each calendar month automatically forgives the *first* fully
inactive day it encounters while a streak is in progress — that day counts toward the
streak as if it had activity, rather than resetting it. A second inactive day in the same
calendar month is not forgiven and breaks the streak normally. Unused freezes do not carry
over to the next month, and a freeze is never granted to an isolated inactive day with no
ongoing streak to protect. This applies to both `currentStreak` and `recordStreak`.

No error responses beyond the standard `401` for a missing/invalid token — there is no
ownership check (the streak is per-account, not per-folder) and no not-found case (an
account with zero activity simply reports a streak of `0`).

**Response** (`GET /api/streak/calendar?month=2026-08`, `month` optional, defaults to the
current month, format `YYYY-MM`)
```json
[
  { "date": "2026-08-01", "status": "GOLD" },
  { "date": "2026-08-02", "status": "PARTIAL" },
  { "date": "2026-08-03", "status": "FROZEN" },
  { "date": "2026-08-04", "status": "NONE" }
]
```
One entry per day from the 1st of the requested month through the earlier of that month's
last day or today — a month entirely in the future returns an empty array. `status` is one
of `NONE` (no activity, not forgiven), `PARTIAL` (some but not all four qualifying actions),
`GOLD` (all four), or `FROZEN` (that month's automatic freeze forgave this otherwise-inactive
day).

Errors: `400` malformed `month` value · `401` unauthenticated.

### Friends

Username search, public profiles, friend requests, and friendships. Every user summary below
excludes email/contact fields entirely — search results, friends, and mutual friends only
ever carry `id`/`username`/`displayName`/`avatarUrl`/`xp`. `xp` is the same current-season
value `Ranking` computes (see below), resolved fresh on every read — never stored alongside
the summary.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/users/search?username={term}` | Search users by username fragment (min 2 chars) |
| `GET` | `/api/users/{username}` | Public profile of a user, resolved relative to the caller |
| `GET` | `/api/friends` | List the caller's friends |
| `DELETE` | `/api/friends/{userId}` | Remove an existing friendship |
| `GET` | `/api/friends/requests` | List the caller's pending friend requests (sent + received) |
| `POST` | `/api/friends/requests` | Send a friend request |
| `POST` | `/api/friends/requests/{id}/accept` | Accept a pending request addressed to the caller |
| `POST` | `/api/friends/requests/{id}/decline` | Decline a pending request addressed to the caller |
| `DELETE` | `/api/friends/requests/{id}` | Cancel a pending request the caller sent |

**User summary shape** (search results, friends, mutual friends)
```json
{ "id": "0198...", "username": "ana.souza", "displayName": "Ana Souza", "avatarUrl": "https://api.dicebear.com/10.x/big-smile/svg?seed=0198...", "xp": 340 }
```

**Search** (`GET /api/users/search`) — up to 20 results, prefix matches ranked before
substring-only matches. Errors: `400` term under 2 characters (after stripping an optional
leading `@`).

**Public profile** (`GET /api/users/{username}`, case-insensitive, leading-`@`-tolerant)
```json
{
  "id": "0198...", "username": "ana.souza", "displayName": "Ana Souza",
  "avatarUrl": "https://api.dicebear.com/10.x/big-smile/svg?seed=0198...", "xp": 340,
  "friendship": "friends", "pendingRequestId": null, "friendCount": 12,
  "mutualFriends": ["<user summary>", "..."]
}
```
`friendship` is one of `none` / `friends` / `request-sent` / `request-received` / `self`,
always relative to the caller. `pendingRequestId` is non-null only for `request-sent`/
`request-received`. `mutualFriends` is empty on the caller's own profile (never a trivial
self-intersection). Errors: `404` unknown username.

**Friends list** (`GET /api/friends`, ordered by username)
```json
[{ "user": "<user summary>", "friendsSince": "2026-08-01T12:00:00Z" }]
```
`DELETE /api/friends/{userId}` — either party may remove the friendship. `204 No Content`.
Errors: `404` no friendship exists between caller and `{userId}` (doesn't distinguish "never
were friends" from "user doesn't exist").

**Friend requests** (`GET /api/friends/requests`)
```json
[{ "id": "0198...", "user": "<user summary>", "direction": "sent", "status": "pending", "createdAt": "2026-08-01T12:00:00Z" }]
```
`user` is always the *other* party, resolved — never the caller. `direction` is `sent` if the
caller is the request's sender, `received` otherwise.

`POST /api/friends/requests` — body `{ "userId": "0198..." }`, response is the same shape as
one list entry above (`direction` always `"sent"`), `201`. Errors: `400` sending to oneself ·
`404` unknown `userId` · `409` already friends, or a pending request already exists between
the two in either direction.

`POST /api/friends/requests/{id}/accept` — recipient only. Creates the friendship, `200`:
```json
{ "id": "0198...", "userIdA": "0198...", "userIdB": "0198...", "createdAt": "2026-08-01T12:00:00Z" }
```
`POST .../decline` — recipient only, `204`. `DELETE /api/friends/requests/{id}` (cancel) —
sender only, `204`. Errors (accept/decline/cancel): `403` wrong party for the action (sender
trying to accept/decline, recipient trying to cancel) · `404` caller is neither party, or the
request isn't `pending`.

### Ranking

XP-based leaderboards, season summaries, and previous-season champions. XP is always
**computed on read** from the current season's `QuizAttempt`/`FlashcardReview` counts — it is
never stored, so a configuration change to the XP weights takes effect immediately on the
next read, no migration. Defaults: `10` XP per completed flashcard review, `25` XP per
graded quiz (`revi.ranking.flashcard-weight`/`revi.ranking.quiz-weight`, both overridable via
environment variables). A season is a UTC calendar month (`id` formatted `"YYYY-MM"`); a
user's XP only reflects activity recorded after the season's `startsAt` — there is no
proportional credit for joining mid-season.

**Access-control convention** (matches Classrooms/Friends): `scope=classroom` without a
`classroomId` is `400` (malformed request); `scope=classroom` for a classroom the caller
isn't a member of is `404` (no relation to disclose).

`scope=friends`/`scope=classroom` reflect real `friends`/`classrooms` membership.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/ranking/summary` | Current season's window/countdown, plus the caller's own position/xp/breakdown, for a scope |
| `GET` | `/api/ranking` | Paginated leaderboard for a scope |
| `GET` | `/api/ranking/champions/previous` | Previous season's top-XP user for a scope |

All three endpoints take the same scope query parameters: `scope` (`global`, `friends`, or
`classroom`, required) and `classroomId` (required only when `scope=classroom`).

**Response** (`GET /api/ranking/summary?scope=global`, `200`)
```json
{
  "seasonId": "2026-09",
  "startsAt": "2026-09-01T00:00:00Z",
  "endsAt": "2026-10-01T00:00:00Z",
  "remainingSeconds": 1234567,
  "position": 7,
  "xp": 350,
  "flashcards": 10,
  "quizzes": 10,
  "total": 128
}
```
`position`/`xp`/`flashcards`/`quizzes` are the *caller's own* current-season stats for this
scope — `position` is `null` when the caller has `0` XP (never a numeric last-place value).
`total` is the scope's full candidate count (not a page size) — identical to the leaderboard
endpoint's `total` for the same scope.

**Response** (`GET /api/ranking?scope=global&page=1&pageSize=20`, `200`)
```json
{
  "entries": [
    { "id": "0198...", "username": "henrique", "avatarUrl": "https://api.dicebear.com/10.x/big-smile/svg?seed=0198...", "xp": 350, "flashcards": 10, "quizzes": 10, "position": 1 },
    { "id": "0198...", "username": "maria", "avatarUrl": "https://api.dicebear.com/10.x/big-smile/svg?seed=0198...", "xp": 0, "flashcards": 0, "quizzes": 0, "position": null }
  ],
  "total": 128,
  "page": 1,
  "pageSize": 20,
  "hasMore": true
}
```
`page`/`pageSize` default to `1`/`20` when omitted. Entries are ordered by current-season XP
descending, ties broken by username ascending. A user with `0` XP always has `position: null`
rather than occupying a numbered last place. `total` is the scope's full candidate count,
independent of pagination — not `entries.length`.

**Response** (`GET /api/ranking/champions/previous?scope=classroom&classroomId=...`, `200`)
```json
{
  "seasonId": "2026-08",
  "scope": "classroom",
  "classroomId": "0198...",
  "user": { "id": "0198...", "username": "henrique", "avatarUrl": "https://api.dicebear.com/10.x/big-smile/svg?seed=0198...", "xp": 350, "flashcards": 10, "quizzes": 10 }
}
```
`classroomId` is `null` for `global`/`friends` scope. A literal `null` body (still `200`) if
nobody in that scope had any nonzero activity in the previous season — including the
platform's first-ever season, where "previous" has no data at all.

Errors (all three endpoints): `400` `scope=classroom` with no `classroomId`, or an unknown
`scope` value · `404` `scope=classroom` for a classroom the caller isn't a member of.

### Classrooms

Turmas: classroom CRUD, membership, folders/content, and invites (nominal by username, or
reusable by link). `classrooms` predates `friends` and resolves every member/author/inviter/
owner id it returns through the same directory `Friends` uses — a member with no `user_directory`
row yet (never made an authenticated request) still gets a deterministic, renderable fallback
(their raw id as username/displayName) rather than a lookup failure.

**Resolved user shape** (`user`/`author`/`invitedBy`/`invitee`/`owner` fields below)
```json
{ "id": "0198...", "username": "ana.souza", "displayName": "Ana Souza", "avatarUrl": "https://api.dicebear.com/10.x/big-smile/svg?seed=0198..." }
```
Note this shape has no `xp` — it's classrooms' own resolution, not `friends`' `UserSummaryResponse`.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/classrooms` | Create a classroom; caller becomes owner |
| `GET` | `/api/classrooms` | List every classroom the caller is a member of |
| `GET` | `/api/classrooms/{id}` | Read a classroom; 404 unless the caller is a member |
| `PATCH` | `/api/classrooms/{id}` | Update name/description/color; owner only |
| `DELETE` | `/api/classrooms/{id}` | Delete a classroom, cascading members/folders/content/invites; owner only |
| `GET` | `/api/classrooms/{id}/members` | List the roster, owner first; any member |
| `PATCH` | `/api/classrooms/{id}/members/{memberId}` | Change a member's role (editor/viewer); owner only |
| `DELETE` | `/api/classrooms/{id}/members/{memberId}` | Remove a member; owner only |
| `POST` | `/api/classrooms/{id}/leave` | Leave voluntarily; not available to the owner |
| `GET`/`POST` | `/api/classrooms/{id}/folders` | List/create folders; any member lists, owner or editor creates |
| `GET`/`PATCH`/`DELETE` | `/api/classrooms/{id}/folders/{folderId}` | Read / rename+recolor / delete a folder |
| `GET` | `/api/me/materials` | The caller's own generated material, as `{childFolderId, kinds}[]` — `kinds` is a subset of `flashcards`/`summary`/`quiz`/`mindmap`; use `childFolderId` as `reviMaterialId` below |
| `GET`/`POST` | `/api/classrooms/{id}/folders/{folderId}/contents` | List/add content (reference or upload) |
| `PATCH`/`DELETE` | `.../contents/{contentId}` | Edit (author only) / delete (author or owner) |
| `POST` | `/api/classrooms/{id}/invites` | Invite a specific user by username; owner only |
| `POST` | `/api/classrooms/{id}/invites/link` | Generate a reusable link invite; owner only |
| `GET`/`DELETE` | `/api/classrooms/{id}/invites` / `/{inviteId}` | List/revoke pending invites; owner only |
| `GET` | `/api/me/invites` | List the caller's own pending nominal invites |
| `GET` | `/api/invites/{code}` | Preview an invite before accepting |
| `POST` | `/api/invites/{inviteId}/accept` \| `/decline` | Accept or decline an invite |

**Response** (classroom, `201`/`200`)
```json
{
  "id": "0198...", "name": "Turma A", "description": "d", "color": "#ff0000",
  "ownerId": "0198...", "ownerUsername": "ana.souza", "role": "owner",
  "memberCount": 1, "folderCount": 0, "createdAt": "2026-08-01T12:00:00Z"
}
```
`role` is the *caller's* resolved role in this classroom (`owner`/`editor`/`viewer`).

**Response** (member, `GET /api/classrooms/{id}/members`, `200`)
```json
[{ "id": "0198...", "classroomId": "0198...", "user": "<resolved user>", "role": "owner", "joinedAt": "2026-08-01T12:00:00Z" }]
```

**Response** (folder, `200`/`201`)
```json
{ "id": "0198...", "classroomId": "0198...", "name": "Semana 1", "color": "#ff0000", "contentCount": 2, "createdAt": "2026-08-01T12:00:00Z" }
```

**Response** (content, `GET`/`POST .../contents`, `200`/`201`)
```json
{
  "id": "0198...", "classroomFolderId": "0198...", "kind": "quiz", "title": "t", "description": "d",
  "author": "<resolved user>", "fileName": null, "fileSize": null, "reviMaterialId": "0198...",
  "createdAt": "2026-08-01T12:00:00Z"
}
```
`author` resolves the same way even for a former member who has since left or been removed —
content stays attributed to them. For a *reference* content (`kind` one of `flashcards`/
`summary`/`quiz`/`mindmap`), the create request must include `reviMaterialId` — a `childFolderId`
(from `GET /api/me/materials`) that actually has generated material of that `kind`; a `pdf`/
`image` content is created via the separate multipart upload endpoint instead (no
`reviMaterialId`).

**Response** (invite, `200`/`201`)
```json
{
  "id": "0198...", "classroomId": "0198...", "code": "AB12CD", "role": "viewer", "status": "pending",
  "invitedBy": "<resolved user>", "invitee": "<resolved user, or null for a link invite>",
  "createdAt": "2026-08-01T12:00:00Z", "expiresAt": null
}
```

**Response** (invite preview, `GET /api/invites/{code}`, `200`)
```json
{
  "inviteId": "0198...", "classroomId": "0198...", "classroomName": "Turma A", "classroomColor": "#ff0000",
  "role": "viewer", "owner": "<resolved user>", "invitee": "<resolved user, or null for a link invite>",
  "memberCount": 12
}
```
Deliberately lighter than the full invite shape above — no `code`/`status`/`createdAt`/
`expiresAt`/`invitedBy`, since this is shown to someone who isn't a member yet. `invitee`
(present only for a nominal invite) is what tells the caller whether declining should call
the decline endpoint at all — a link invite has no invitee to decline against, and calling
decline on one responds `403` (the decline endpoint's "only the nominal invitee" rule can
never match `null`).

Errors (general access-control convention, matches Friends/Ranking): `404` for "no relation to
the resource" (non-member reading a classroom, an invite the caller isn't the invitee of) ·
`403` for "confirmed relation but wrong role/party" (a non-owner attempting an owner-only
action) · `400` for malformed input · `409`/`410` for state conflicts (already a member,
duplicate invite, an invite that's expired/revoked/used).
