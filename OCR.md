# OCR, busca por conteúdo e leitura em voz alta

Documento para o time de backend. O frontend já está implementado e funcionando —
contra um **fallback mockado**, porque os dois endpoints descritos aqui ainda não
existem no `revi_back`. Assim que eles subirem, o fallback deixa de ser acionado
sozinho: nenhuma tela precisa mudar.

**Motivação**: o Revi devolve tudo em texto — flash cards, resumo, simulado, mapa
mental. Isso exclui quem não lê: uma criança em alfabetização, alguém com
dislexia, um aluno com baixa visão. Estas funcionalidades existem para que o app
seja usável **de ouvido**.

> **Nota importante**: o backend **já roda OCR** hoje. O `docs/API.md` registra que
> o pipeline assíncrono de categorização usa Groq para OCR antes de o OpenAI gerar
> o resumo. O texto extraído simplesmente não é exposto por nenhum endpoint — é
> isso que este documento pede.

---

## 1. O que já está implementado no frontend

### Painel com o texto da imagem
`src/components/OcrSheet.tsx`, dentro de `src/components/MaterialViewer.tsx`.
Ao abrir um material na tela do assunto, um painel nasce **espiando** na borda de
baixo, com o título "Texto da imagem", um botão de áudio e as duas primeiras
linhas. Toca para expandir até 70% da tela, com o texto rolável.

Estados cobertos: carregando, **extraindo** (`extractedAt: null`), sem texto,
erro, e texto disponível. O painel só aparece quando há um `contentId` — o
`PhotoReview` (prévia local, antes do upload) usa o mesmo visualizador e não tem
conteúdo no servidor para consultar.

### Busca por conteúdo dentro do assunto
`src/routes/(private)/pastas/$pastaId/assuntos/$assuntoId/index.tsx`.
Debounce de 400 ms, mínimo de 2 caracteres, `AbortSignal` para cancelar a busca
anterior, indicador no campo e ramos de render próprios para "buscando" e "a busca
falhou". Os resultados vivem em estado separado da listagem, porque o polling de
`hasSummary` reescreve a lista a cada 3 s e atropelaria a busca.

### Leitura em voz alta
Um botão de áudio no cabeçalho de cada um dos quatro modos de estudo e no painel de
OCR. Mais uma preferência opcional de **leitura automática** (desligada por padrão)
que lê sozinho o próximo flash card e a próxima pergunta do simulado, e um controle
de **velocidade** (0,5× a 2×) no Perfil.

| Onde | O que é falado |
| --- | --- |
| Painel de OCR | O texto extraído da imagem. |
| Flash cards | A pergunta; a resposta entra depois de revelada. |
| Resumo | O markdown convertido para texto falável. |
| Simulado | Enunciado e as quatro alternativas, numeradas. **Nunca** qual é a correta. |
| Mapa mental | A árvore em ordem de leitura, o mesmo conteúdo do índice `sr-only` do canvas. |

---

## 2. Endpoints a implementar

### 2.1 Texto extraído de um conteúdo

| Método | Caminho | Descrição |
|---|---|---|
| `GET` | `/api/contents/{id}/text` | Devolve o texto que o OCR extraiu do conteúdo |

**Resposta**
```json
{
  "contentId": "0198...",
  "text": "Função do 1º grau\n\nToda função do 1º grau pode ser escrita como f(x) = ax + b...",
  "extractedAt": "2026-09-03T12:34:56Z"
}
```

**Semântica de `extractedAt`** — é o contrato que a interface já respeita:
- **preenchido**: extração concluída, `text` é o resultado final;
- **`null`**: o pipeline ainda está rodando. O front mostra "O Revi IA ainda está
  lendo esta imagem" em vez de tratar como erro. Se preferir devolver `404`
  enquanto não terminou, também funciona — o front trata `404` como "ainda não
  disponível", igual faz com `GET /api/child-folders/{id}/summary`.

**Formato do `text`**: texto puro com `\n` preservando as quebras de linha e os
parágrafos da página. O front renderiza com `whitespace-pre-line` e passa o mesmo
texto para a fala. Markdown é aceito (o conversor de fala já lida com ele), mas não
é necessário.

Erros: `403`/`404` conteúdo que não pertence a quem chama · `401` não autenticado.

### 2.2 Busca de conteúdo dentro do assunto

| Método | Caminho | Descrição |
|---|---|---|
| `GET` | `/api/child-folders/{childFolderId}/contents?search={termo}` | Lista os conteúdos do assunto que casam com o termo |

Devolve o **mesmo shape** de `Content[]` que a listagem sem parâmetro já devolve —
é uma extensão do endpoint existente, não um endpoint novo.

**A busca precisa cobrir nome do arquivo E o texto extraído por OCR.** Este é o
ponto central: filtrar por nome de arquivo o frontend já fazia sozinho. O que
justifica a chamada de rede é buscar *dentro* do conteúdo — o aluno lembra que
"tinha algo sobre inércia" e não do nome do arquivo.

Requisitos de comparação: **sem acento e sem diferenciar maiúscula de minúscula**
(o front normaliza o termo com `normalizeText`, mas a comparação de verdade tem de
ser no banco). Termo vazio ou ausente devolve a lista completa.

Paginação: hoje o front não pagina esta lista. Se o volume justificar, avise que
vamos precisar ajustar a tela.

> **Atenção a um comportamento que já está no código**: se o backend **ignorar** o
> parâmetro `search` e devolver a lista inteira, o front aplica um filtro por nome
> no cliente para não mentir na tela ("busquei" e mostrar tudo). Isso é uma rede de
> segurança, não a funcionalidade — sem o filtro no servidor, a busca por texto de
> OCR simplesmente não acontece.

### 2.3 Sugestão: um sinal na listagem

Seria útil `Content` ganhar um booleano indicando se já existe texto extraído:

```json
{ "id": "0198...", "name": "notes.pdf", "contentType": "PDF",
  "childFolderId": "0198...", "hasSummary": true, "hasText": true }
```

Sem isso, para o tile indicar "tem texto para ouvir" o front precisaria de uma
chamada por item — o mesmo problema que já existe com `download-url`, que hoje é
uma requisição por material na grade.

---

## 3. Contrato de dados

`src/types/api/content.ts`:

```ts
export interface ContentText {
  contentId: string;
  text: string;
  /** `null` enquanto o pipeline de OCR ainda não terminou. */
  extractedAt: string | null;
}
```

Os services correspondentes, em `src/api/content.ts`:

```ts
export function getContentText(
  contentId: string,
  signal?: AbortSignal,
): Promise<ContentText | null>;

export function searchContent(
  childFolderId: string,
  term: string,
  signal?: AbortSignal,
): Promise<Content[]>;
```

**O fallback e como removê-lo.** `src/mocks/contentOcr.ts` é o arquivo inteiro a
ser apagado. Ele é acionado apenas por `isMissingEndpoint(error)` — `404` ou `501`.
Qualquer outro erro (`403`, `500`, rede) **é propagado**, de propósito: um 500 não
pode virar dado falso silenciosamente. Isso está travado por teste em
`src/mocks/contentOcr.test.ts`.

---

## 4. Leitura em voz alta — onde trocar de motor

Hoje a fala é 100% do navegador (Web Speech API), sem custo e sem rede. A camada
está isolada para que trocar por uma API de fala seja uma mudança de um arquivo:

| Arquivo | Papel |
| --- | --- |
| `src/utils/speech.ts` | A fachada. Expõe `speak`/`cancelSpeech`/`isSpeechSupported` e a interface `SpeechDriver`. **`setSpeechDriver(driver)` é o ponto de troca.** |
| `src/utils/speechDrivers/webSpeech.ts` | A implementação com `window.speechSynthesis`. |
| `src/utils/speechText.ts` | Preparação do texto: markdown → falável, LaTeX → português, símbolos unicode → palavra, e fatiamento em trechos. Puro e testado. |
| `src/hooks/useSpeech.ts` | Ponte com React: velocidade, auto-leitura e cancelamento no unmount. |
| `src/components/SpeakButton.tsx` | O botão. |

O driver é registrado uma única vez, em `src/contexts/PreferencesContext.tsx`.

**Se o time quiser uma API de fala na nuvem**, o driver novo precisa cumprir
`SpeechDriver`: receber os trechos já fatiados, tocar em sequência e reportar
`"idle" | "speaking" | "paused"`. Nesse caso o backend precisaria de algo como
`POST /api/speech` recebendo `{ text, rate, lang }` e devolvendo áudio
(`audio/mpeg`) — de preferência **por trecho**, para a fala começar antes de o
áudio inteiro ser sintetizado. Vale considerar cache por hash do texto: o resumo
de um assunto é o mesmo para todos os alunos daquela pasta.

Motivos para considerar a troca: a voz `pt-BR` **não é garantida** — em alguns
Android e na maioria dos Linux não há voz portuguesa instalada, e a leitura sai com
sotaque inglês. O driver atual tenta `pt-BR`, cai para `pt` e, sem nenhuma das
duas, deixa o navegador escolher.

---

## 5. Pontos em aberto para validar

1. **Posição das palavras.** Se o OCR devolver as caixas (bounding boxes) de cada
   palavra, dá para destacar o que está sendo lido em cima da imagem — o efeito
   "karaokê". Para quem está em alfabetização, ver a palavra enquanto ouve é o que
   mais ajuda. A Web Speech API já emite `onboundary` por palavra, então falta só o
   dado. Vale a pena?
2. **Confiança da extração.** Foto tremida ou letra cursiva geram texto ruim. Um
   score (global ou por trecho) permitiria avisar "a leitura desta foto pode estar
   incompleta" em vez de narrar bobagem com confiança.
3. **Reprocessamento.** Se o modelo de OCR melhorar, o texto já extraído é
   reprocessado? O front não guarda cache próprio, então basta a resposta mudar.
4. **PDF de várias páginas.** O `text` cobre o documento inteiro ou só a primeira
   página? Se for inteiro, qual o limite de tamanho? A busca deve varrer todas as
   páginas?
5. **Limite de tamanho da resposta.** O front fatia o texto para a fala, mas um
   `text` de centenas de KB pesaria no payload. Faz sentido paginar por página do
   PDF?
6. **Privacidade na busca dentro da turma.** Hoje a busca é sempre nos próprios
   conteúdos do aluno. Se um dia buscar no material compartilhado de uma turma, o
   texto de OCR de um arquivo que outra pessoa enviou passa a ser pesquisável por
   todos os membros — precisa de decisão explícita.
7. **Idioma do conteúdo.** Um material em inglês seria lido por uma voz portuguesa.
   Se o OCR já detecta idioma, expor isso (`lang`) permitiria escolher a voz certa.
8. **Quem tem acesso ao texto.** Confirmar que `GET /api/contents/{id}/text` segue
   exatamente a mesma regra de dono que `download-url`.
