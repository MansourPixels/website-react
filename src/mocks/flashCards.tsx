import { Math } from "@/components/Math";
import type { ReactNode } from "react";

export interface FlashCardData {
  pergunta: string;
  resposta: ReactNode;
}

export const flashCards: FlashCardData[] = [
  {
    pergunta: "Qual é a forma geral de uma equação do terceiro grau?",
    resposta: (
      <>
        <Math>ax³ + bx² + cx + d = 0</Math>, onde <Math>a</Math>, <Math>b</Math>
        , <Math>c</Math> e <Math>d</Math> são números reais (ou complexos) e
        obrigatoriamente <Math>a ≠ 0</Math>.
      </>
    ),
  },
  {
    pergunta: "Qual é o resultado de 2⁵?",
    resposta: (
      <>
        <Math>32</Math>, pois <Math>2⁵ = 2 × 2 × 2 × 2 × 2</Math>.
      </>
    ),
  },
  {
    pergunta: "Em um triângulo retângulo, o teorema de Pitágoras relaciona:",
    resposta: (
      <>
        Os comprimentos dos três lados (<Math>a² + b² = c²</Math> na forma mais
        conhecida).
      </>
    ),
  },
  {
    pergunta: "Qual é a raiz quadrada de 81?",
    resposta: (
      <>
        <Math>9</Math>, pois <Math>9 × 9 = 81</Math>.
      </>
    ),
  },
  {
    pergunta:
      "O que representa o coeficiente 'a' na função f(x) = ax + b (a ≠ 0)?",
    resposta: "A inclinação (taxa de variação) da reta.",
  },
  {
    pergunta: "Quantos lados tem um hexágono?",
    resposta: (
      <>
        <Math>6</Math> lados.
      </>
    ),
  },
  {
    pergunta:
      "Qual é o valor de π (pi) aproximado comumente usado em exercícios?",
    resposta: (
      <>
        Aproximadamente <Math>3,14</Math>.
      </>
    ),
  },
  {
    pergunta: "A soma dos ângulos internos de um triângulo é:",
    resposta: <Math>180°</Math>,
  },
  {
    pergunta: "Qual destas expressões é um monômio?",
    resposta: (
      <>
        <Math>3x²</Math> — um monômio tem um único termo algébrico.
      </>
    ),
  },
  {
    pergunta: "O número 0,25 em fração irredutível é:",
    resposta: <Math>1/4</Math>,
  },
];
