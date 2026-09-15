/**
 * Preparação do texto que vai para a fala.
 *
 * Tudo aqui é função pura, e é de propósito: é neste arquivo que moram os erros
 * que o usuário percebe — ouvir "asterisco asterisco" no meio de um resumo, ou
 * "x dois" onde se lê "x ao quadrado". O motor de fala em si
 * (`src/utils/speech.ts`) não decide nada sobre o texto.
 */

/**
 * Símbolos matemáticos que a API devolve como unicode (ver o comentário de
 * `src/components/Math.tsx`). Sem esta tradução o sintetizador ou pula o
 * caractere ou lê o nome errado.
 *
 * A ordem importa: entradas mais longas primeiro, para `≤` não ser lido como
 * `<` seguido de `=`.
 */
const SPOKEN_SYMBOLS: [string, string][] = [
  ["≠", " diferente de "],
  ["≤", " menor ou igual a "],
  ["≥", " maior ou igual a "],
  ["±", " mais ou menos "],
  ["∞", " infinito "],
  ["√", " raiz de "],
  ["∫", " integral de "],
  ["Σ", " somatório de "],
  ["Δ", " delta "],
  ["π", " pi "],
  ["α", " alfa "],
  ["β", " beta "],
  ["θ", " teta "],
  ["λ", " lambda "],
  ["μ", " mi "],
  ["ω", " ômega "],
  ["→", " leva a "],
  ["×", " vezes "],
  ["÷", " dividido por "],
  ["·", " vezes "],
  ["°", " graus "],
  ["²", " ao quadrado "],
  ["³", " ao cubo "],
  ["⁴", " à quarta potência "],
  ["½", " um meio "],
  ["¼", " um quarto "],
  ["¾", " três quartos "],
];

const SUBSCRIPTS = "₀₁₂₃₄₅₆₇₈₉";

function collapseSpaces(text: string): string {
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .trim();
}

/**
 * As substituições de símbolo entram cercadas de espaço para não colar em
 * palavra vizinha, o que deixa um espaço antes da pontuação ("ao quadrado ?").
 * Na fala isso vira uma pausa no lugar errado.
 */
function tidyPunctuation(text: string): string {
  return text
    .replace(/\s+([,.;:!?)\]])/g, "$1")
    .replace(/([([])\s+/g, "$1")
    .replace(/([.!?])(?:\s*[.;])+/g, "$1");
}

/** Só há o que falar se sobrou letra ou número. */
function hasSpeakableContent(text: string): boolean {
  return /[\p{L}\p{N}]/u.test(text);
}

/** Troca símbolos matemáticos unicode pela palavra correspondente. */
export function speakableSymbols(text: string): string {
  let result = text;

  for (const [symbol, spoken] of SPOKEN_SYMBOLS) {
    result = result.split(symbol).join(spoken);
  }

  // Índices (H₂O, x₁): "índice dois" em vez de o caractere ser engolido.
  result = result.replace(
    new RegExp(`[${SUBSCRIPTS}]`, "g"),
    (character) => ` índice ${SUBSCRIPTS.indexOf(character)} `,
  );

  return tidyPunctuation(collapseSpaces(result));
}

/** Comandos LaTeX que aparecem no resumo, com a leitura em português. */
const LATEX_WORDS: [RegExp, string][] = [
  [/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "$1 sobre $2"],
  [/\\d?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "$1 sobre $2"],
  [/\\sqrt\s*\{([^{}]*)\}/g, "raiz de $1"],
  [/\\text\s*\{([^{}]*)\}/g, "$1"],
  [/\\mathrm\s*\{([^{}]*)\}/g, "$1"],
  [/\\left|\\right/g, ""],
  [/\\times/g, " vezes "],
  [/\\cdot/g, " vezes "],
  [/\\div/g, " dividido por "],
  [/\\pm/g, " mais ou menos "],
  [/\\neq/g, " diferente de "],
  [/\\leq/g, " menor ou igual a "],
  [/\\geq/g, " maior ou igual a "],
  [/\\approx/g, " aproximadamente "],
  [/\\infty/g, " infinito "],
  [/\\pi/g, " pi "],
  [/\\alpha/g, " alfa "],
  [/\\beta/g, " beta "],
  [/\\theta/g, " teta "],
  [/\\Delta/g, " delta "],
  [/\\lambda/g, " lambda "],
  [/\\sum/g, " somatório de "],
  [/\\int/g, " integral de "],
  [/\\to|\\rightarrow/g, " leva a "],
];

/**
 * Converte uma expressão LaTeX em algo pronunciável. Não é um parser: cobre o
 * que o resumo do Revi IA realmente usa e degrada para "o que sobrou do texto"
 * no resto. Ler LaTeX cru em voz alta é pior que ler uma aproximação.
 */
export function latexToSpeech(expression: string): string {
  let result = expression;

  for (const [pattern, replacement] of LATEX_WORDS) {
    result = result.replace(pattern, replacement);
  }

  // Expoentes e índices na forma LaTeX: x^{2}, x^2, a_1.
  result = result
    .replace(/\^\s*\{?\s*2\s*\}?/g, " ao quadrado ")
    .replace(/\^\s*\{?\s*3\s*\}?/g, " ao cubo ")
    .replace(/\^\s*\{?([^{}\s]+)\}?/g, " elevado a $1 ")
    .replace(/_\s*\{?([^{}\s]+)\}?/g, " índice $1 ");

  // Sobrou barra invertida, chave ou til de espaço: nada disso se fala.
  result = result.replace(/\\[a-zA-Z]+/g, " ").replace(/[{}\\~]/g, " ");

  return tidyPunctuation(collapseSpaces(result));
}

/**
 * Markdown (o formato do resumo e do texto de OCR) para texto falável.
 *
 * A ordem das etapas importa: código sai antes de qualquer coisa, senão o
 * conteúdo dele é interpretado como marcação.
 */
export function markdownToSpeech(markdown: string): string {
  let text = markdown;

  // Blocos de código: ninguém quer ouvir um bloco de código lido caractere a
  // caractere.
  text = text.replace(/```[\s\S]*?```/g, " ");
  text = text.replace(/`([^`]*)`/g, "$1");

  // LaTeX em bloco e inline, nos dois estilos de delimitador que o resumo usa.
  text = text.replace(
    /\$\$([\s\S]*?)\$\$/g,
    (_m, expr: string) => ` ${latexToSpeech(expr)} `,
  );
  text = text.replace(
    /\\\[([\s\S]*?)\\\]/g,
    (_m, expr: string) => ` ${latexToSpeech(expr)} `,
  );
  text = text.replace(
    /\\\(([\s\S]*?)\\\)/g,
    (_m, expr: string) => ` ${latexToSpeech(expr)} `,
  );
  text = text.replace(
    /\$([^$\n]+)\$/g,
    (_m, expr: string) => ` ${latexToSpeech(expr)} `,
  );

  text = text.replace(/<[^>]+>/g, " ");

  // Imagens antes de links: a sintaxe de imagem contém a de link.
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");

  // Separador de tabela e régua horizontal não têm leitura.
  text = text.replace(/^\s*\|?[\s:|-]*\|[\s:|-]*\|?\s*$/gm, "");
  text = text.replace(/^\s*([-*_])\s*(\1\s*){2,}$/gm, "");

  // Célula de tabela vira pausa curta, para as colunas não colarem.
  text = text.replace(/^\s*\|(.+)\|\s*$/gm, (_m, row: string) =>
    row
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0)
      .join(", "),
  );

  // Título vira frase: o ponto final é o que faz o sintetizador pausar.
  text = text.replace(/^\s{0,3}#{1,6}\s+(.*)$/gm, (_m, heading: string) => {
    const trimmed = heading.trim().replace(/[#\s]+$/, "");

    return /[.!?:;]$/.test(trimmed) ? trimmed : `${trimmed}.`;
  });

  text = text.replace(/^\s{0,3}>\s?/gm, "");

  // Marcador de lista sai; o item ganha ponto para virar uma frase.
  text = text.replace(/^\s*(?:[-*+]|\d+[.)])\s+(.*)$/gm, (_m, item: string) => {
    const trimmed = item.trim();

    return /[.!?:;]$/.test(trimmed) ? trimmed : `${trimmed}.`;
  });

  // Ênfase e riscado: só os marcadores saem, o conteúdo fica.
  text = text.replace(/(\*\*|__)(.*?)\1/g, "$2");
  text = text.replace(/(\*|_)(?!\s)(.*?)(?<!\s)\1/g, "$2");
  text = text.replace(/~~(.*?)~~/g, "$1");

  // Parágrafo em branco vira fim de frase; o resto do espaço colapsa.
  text = text.replace(/\n{2,}/g, ". ");
  text = text.replace(/\n/g, " ");
  text = text.replace(/\s*\.\s*\.\s*/g, ". ");

  const spoken = speakableSymbols(collapseSpaces(text));

  // Entrada só com espaço em branco atravessa as regras acima e sairia como
  // ".", que o sintetizador leria como uma pausa solta.
  if (!hasSpeakableContent(spoken)) return "";

  return spoken.replace(/^[.\s]+/, "").trim();
}

/**
 * Limite por trecho. Enunciado longo trava ou é cortado no meio no Chrome, e
 * `speechSynthesis` não avisa quando isso acontece — a única defesa é nunca
 * mandar muito texto de uma vez.
 */
const DEFAULT_MAX_CHARS = 220;

function splitLongSentence(sentence: string, maxChars: number): string[] {
  if (sentence.length <= maxChars) return [sentence];

  const parts: string[] = [];
  let rest = sentence;

  while (rest.length > maxChars) {
    const window = rest.slice(0, maxChars);
    // Vírgula é a melhor emenda; depois espaço; corte duro é último recurso,
    // para uma palavra gigante (uma URL, por exemplo) não travar o laço.
    const cut =
      window.lastIndexOf(", ") > 0
        ? window.lastIndexOf(", ") + 1
        : window.lastIndexOf(" ") > 0
          ? window.lastIndexOf(" ")
          : maxChars;

    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }

  if (rest.length > 0) parts.push(rest);

  return parts;
}

/** Corta o texto em trechos faláveis, preferindo fronteira de frase. */
export function chunkForSpeech(
  text: string,
  maxChars: number = DEFAULT_MAX_CHARS,
): string[] {
  const clean = collapseSpaces(text);

  if (clean.length === 0) return [];

  const sentences = clean
    .split(/(?<=[.!?…])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);

  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    for (const piece of splitLongSentence(sentence, maxChars)) {
      if (current.length === 0) {
        current = piece;
        continue;
      }

      if (current.length + 1 + piece.length <= maxChars) {
        current = `${current} ${piece}`;
        continue;
      }

      chunks.push(current);
      current = piece;
    }
  }

  if (current.length > 0) chunks.push(current);

  return chunks;
}

// --- Compositores por tela ---------------------------------------------------
// Ficam aqui, e não nas páginas, para a frase falada ser testável e para duas
// telas nunca divergirem no jeito de anunciar a mesma coisa.

export function flashcardSpeech(card: {
  front: string;
  back?: string | null;
}): string {
  const question = speakableSymbols(card.front);

  if (card.back === undefined || card.back === null || card.back.length === 0) {
    return question;
  }

  return `Resposta: ${speakableSymbols(card.back)}`;
}

export function quizSpeech(question: {
  question: string;
  options: { letter: string; text: string }[];
}): string {
  const enunciado = speakableSymbols(question.question);

  const alternativas = question.options
    .map(
      ({ letter, text }, index) =>
        `${index === question.options.length - 1 ? "Ou, " : ""} Alternativa ${letter}: ${speakableSymbols(text)}`,
    )
    .join(". ");

  return `${enunciado}. ${alternativas}`;
}

interface SpeakableBranch {
  label: string;
  detalhe?: string;
  formula?: string;
  children?: SpeakableBranch[];
}

/**
 * O mapa mental em ordem de leitura — o mesmo conteúdo que o índice `sr-only`
 * de `MindMapCanvas` já entrega ao leitor de tela.
 */
export function mindMapSpeech(root: SpeakableBranch | null): string {
  if (root === null) return "";

  const parts: string[] = [];

  function walk(branch: SpeakableBranch) {
    const pieces = [branch.label, branch.detalhe, branch.formula]
      .filter(
        (piece): piece is string =>
          typeof piece === "string" && piece.trim().length > 0,
      )
      .map((piece) => speakableSymbols(piece).replace(/\.$/, ""));

    parts.push(`${pieces.join(". ")}.`);

    for (const child of branch.children ?? []) walk(child);
  }

  walk(root);

  return collapseSpaces(parts.join(" "));
}
