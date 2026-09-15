import type { Content } from "@/types/api/content";
import { normalizeText } from "@/utils/text";

/**
 * Fallback demonstrativo da busca por OCR, enquanto o backend não aceita
 * `search` na listagem de conteúdos.
 */

/** Páginas fictícias de caderno, atribuídas de forma estável por conteúdo. */
const SAMPLE_PAGES: string[] = [
  `Função do 1º grau

Toda função do 1º grau pode ser escrita como f(x) = ax + b, com a diferente de zero.

O coeficiente a é o coeficiente angular: ele diz a inclinação da reta. Quando a é positivo a função é crescente; quando a é negativo, decrescente.

O coeficiente b é o coeficiente linear: é o ponto em que a reta corta o eixo y.

Exemplo: em f(x) = 2x + 3, a reta sobe 2 unidades para cada unidade de x e corta o eixo y no ponto 3.`,

  `Leis de Newton

1ª lei — inércia: um corpo em repouso permanece em repouso, e um corpo em movimento mantém velocidade constante, a não ser que uma força atue sobre ele.

2ª lei: a força resultante é igual à massa vezes a aceleração. F = m · a.

3ª lei — ação e reação: para toda força de ação existe uma força de reação de mesma intensidade, mesma direção e sentido oposto.

Atenção: as forças de ação e reação atuam em corpos diferentes, e por isso não se cancelam.`,

  `Ciclo trigonométrico

O ciclo trigonométrico é uma circunferência de raio 1 com centro na origem.

O seno de um ângulo é a coordenada y do ponto correspondente; o cosseno é a coordenada x.

Valores notáveis: seno de 30 graus vale um meio; seno de 45 graus vale raiz de 2 sobre 2; seno de 60 graus vale raiz de 3 sobre 2.

Vale sempre a relação fundamental: seno ao quadrado mais cosseno ao quadrado é igual a 1.`,

  `Organelas celulares

Mitocôndria: produz energia pela respiração celular. É conhecida como a usina da célula.

Ribossomo: monta as proteínas a partir da informação trazida pelo RNA mensageiro.

Complexo de Golgi: empacota e distribui as proteínas produzidas.

Lisossomo: faz a digestão intracelular, quebrando o que a célula não usa mais.

Retículo endoplasmático: transporta substâncias dentro da célula.`,

  `Revolução Industrial

Começou na Inglaterra na segunda metade do século XVIII.

Causas principais: acúmulo de capital do comércio marítimo, mão de obra disponível pelo êxodo rural, e disponibilidade de carvão e ferro.

A máquina a vapor de James Watt permitiu multiplicar a produção e transformou o transporte.

Consequências: crescimento das cidades, surgimento do operariado urbano e jornadas de trabalho muito longas, que depois motivaram as primeiras leis trabalhistas.`,
];

/** Índice estável a partir do id: o mesmo material mostra sempre o mesmo texto. */
function seedIndex(contentId: string, length: number): number {
  let hash = 0;

  for (const character of contentId) {
    hash = (hash * 31 + character.codePointAt(0)!) % 100_000;
  }

  return hash % length;
}

function sampleTextForContent(contentId: string): string {
  return SAMPLE_PAGES[seedIndex(contentId, SAMPLE_PAGES.length)];
}

/**
 * Busca por nome **e** pelo texto mockado de OCR. É o que demonstra o ganho
 * real do endpoint: buscar dentro do conteúdo, não só no nome do arquivo.
 */
export function mockSearchContents(
  contents: Content[],
  term: string,
): Content[] {
  const normalized = normalizeText(term);

  if (normalized.length === 0) return contents;

  return contents.filter((content) => {
    if (normalizeText(content.name).includes(normalized)) return true;

    return normalizeText(sampleTextForContent(content.id)).includes(normalized);
  });
}
