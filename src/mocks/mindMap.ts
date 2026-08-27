/**
 * Esquema do mapa mental gerado pela Revi IA.
 *
 * Tudo aqui é serializável em JSON de propósito: apenas strings e arrays,
 * sem `ReactNode`. É esse o formato que um modelo devolve, e é esse o
 * formato que `parseMindMap` valida antes de qualquer coisa chegar à tela.
 */
export interface MindMapBranch {
  id: string;
  label: string;
  /** Explicação curta, revelada dentro do próprio nó. */
  detalhe?: string;
  /** Expressão matemática, renderizada com a fonte de fórmulas. */
  formula?: string;
  children?: MindMapBranch[];
}

export interface MindMapData {
  assunto: string;
  raiz: MindMapBranch;
}

export const mindMap: MindMapData = {
  assunto: "Equação de terceiro grau",
  raiz: {
    id: "cubica",
    label: "Equação do 3º grau",
    formula: "ax³ + bx² + cx + d = 0",
    detalhe: "Com a ≠ 0. Se a = 0, deixa de ser cúbica.",
    children: [
      {
        id: "coeficientes",
        label: "Coeficientes",
        detalhe: "Os quatro números que definem a equação.",
        children: [
          {
            id: "coef-a",
            label: "a decide o formato",
            detalhe: "Positivo, a curva sobe no fim. Negativo, desce.",
          },
          {
            id: "coef-d",
            label: "d é o termo independente",
            detalhe: "É onde o gráfico corta o eixo y, e onde as raízes se escondem.",
          },
        ],
      },
      {
        id: "girard",
        label: "Relações de Girard",
        detalhe: "Ligam as raízes aos coeficientes sem resolver nada.",
        children: [
          {
            id: "girard-soma",
            label: "Soma das raízes",
            formula: "r¹ + r² + r³ = -b/a",
          },
          {
            id: "girard-produto",
            label: "Produto das raízes",
            formula: "r¹·r²·r³ = -d/a",
          },
          {
            id: "girard-pares",
            label: "Soma dos produtos dois a dois",
            formula: "r¹·r² + r¹·r³ + r²·r³ = c/a",
          },
        ],
      },
      {
        id: "resolucao",
        label: "Como resolver",
        detalhe: "A ordem que economiza tempo na prova.",
        children: [
          {
            id: "resolucao-evidencia",
            label: "1. d = 0? Fatore x",
            detalhe: "Uma raiz é zero e sobra uma equação do 2º grau.",
          },
          {
            id: "resolucao-divisores",
            label: "2. Teste os divisores de d",
            detalhe: "Toda raiz racional tem a forma p/q, com p dividindo d.",
          },
          {
            id: "resolucao-ruffini",
            label: "3. Divida por Briot-Ruffini",
            detalhe: "Achada uma raiz r¹, divida por (x - r¹). Sobra uma quadrática.",
          },
          {
            id: "resolucao-bhaskara",
            label: "4. Resolva por Bhaskara",
            detalhe: "E confira o resultado com as relações de Girard.",
          },
        ],
      },
      {
        id: "natureza",
        label: "Natureza das raízes",
        detalhe: "O discriminante diz quantas raízes reais existem.",
        children: [
          {
            id: "natureza-positivo",
            label: "Δ > 0",
            detalhe: "Três raízes reais e distintas.",
          },
          {
            id: "natureza-zero",
            label: "Δ = 0",
            detalhe: "Pelo menos duas raízes reais iguais.",
          },
          {
            id: "natureza-negativo",
            label: "Δ < 0",
            detalhe: "Uma raiz real e duas complexas conjugadas.",
          },
        ],
      },
      {
        id: "armadilhas",
        label: "Armadilhas comuns",
        children: [
          {
            id: "armadilha-duas",
            label: "Nunca são duas raízes reais",
            detalhe:
              "Raízes complexas aparecem sempre em pares conjugados, então sobrariam três reais.",
          },
          {
            id: "armadilha-cardano",
            label: "Cardano quase nunca é o caminho",
            detalhe: "Quase toda cúbica de prova foi montada para ter raiz inteira.",
          },
        ],
      },
    ],
  },
};

/**
 * Ponto de troca por uma chamada real de IA. Hoje devolve o mock fixo,
 * no mesmo formato de `categorizeImage`.
 */
export function generateMindMap(): Promise<MindMapData> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mindMap), 1200);
  });
}

const MAX_DEPTH = 4;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function parseBranch(
  value: unknown,
  depth: number,
  seenIds: Set<string>,
): MindMapBranch | null {
  if (!isRecord(value)) return null;

  const id = optionalText(value.id);
  const label = optionalText(value.label);
  if (id === undefined || label === undefined || seenIds.has(id)) return null;

  seenIds.add(id);

  const children: MindMapBranch[] = [];
  if (depth < MAX_DEPTH && Array.isArray(value.children)) {
    for (const child of value.children) {
      const parsed = parseBranch(child, depth + 1, seenIds);
      if (parsed !== null) children.push(parsed);
    }
  }

  return {
    id,
    label,
    detalhe: optionalText(value.detalhe),
    formula: optionalText(value.formula),
    children: children.length > 0 ? children : undefined,
  };
}

/**
 * Saída de modelo é entrada não-confiável: um `label` nulo ou um ciclo de ids
 * derrubaria a tela. Descarta o que estiver malformado em vez de confiar.
 */
export function parseMindMap(input: unknown): MindMapData | null {
  if (!isRecord(input)) return null;

  const assunto = optionalText(input.assunto);
  const raiz = parseBranch(input.raiz, 0, new Set());
  if (assunto === undefined || raiz === null) return null;

  return { assunto, raiz };
}
