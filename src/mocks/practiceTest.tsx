import { Math } from "@/components/Math";
import type { ReactNode } from "react";

export interface PracticeTestAlternative {
  texto: ReactNode;
  correta?: boolean;
}

export interface PracticeTestQuestion {
  pergunta: string;
  alternativas: PracticeTestAlternative[];
}

export const practiceTest: PracticeTestQuestion[] = [
  {
    pergunta: "Qual é a forma geral de uma equação do terceiro grau?",
    alternativas: [
      { texto: <Math>a/x + b = 0</Math> },
      { texto: <Math>ax + b = 0</Math> },
      { texto: <Math>ax³ + bx² + cx + d = 0</Math>, correta: true },
      { texto: <Math>ax² + bx + c = 0</Math> },
    ],
  },
  {
    pergunta: "Qual é o resultado de 2⁵?",
    alternativas: [
      { texto: <Math>10</Math> },
      { texto: <Math>25</Math> },
      { texto: <Math>32</Math>, correta: true },
      { texto: <Math>64</Math> },
    ],
  },
  {
    pergunta: "Em um triângulo retângulo, o teorema de Pitágoras relaciona:",
    alternativas: [
      { texto: "Os três ângulos internos do triângulo." },
      {
        texto: (
          <>
            Os comprimentos dos três lados (<Math>a² + b² = c²</Math>).
          </>
        ),
        correta: true,
      },
      { texto: "A área e o perímetro do triângulo." },
      { texto: "Apenas os dois catetos, sem relação com a hipotenusa." },
    ],
  },
  {
    pergunta: "Qual é a raiz quadrada de 81?",
    alternativas: [
      { texto: <Math>7</Math> },
      { texto: <Math>8</Math> },
      { texto: <Math>9</Math>, correta: true },
      { texto: <Math>18</Math> },
    ],
  },
  {
    pergunta:
      "O que representa o coeficiente 'a' na função f(x) = ax + b (a ≠ 0)?",
    alternativas: [
      { texto: "O ponto em que a reta corta o eixo y." },
      { texto: "A inclinação (taxa de variação) da reta.", correta: true },
      { texto: "A raiz da função." },
      { texto: "A concavidade da parábola." },
    ],
  },
  {
    pergunta: "Quantos lados tem um hexágono?",
    alternativas: [
      { texto: <Math>4</Math> },
      { texto: <Math>5</Math> },
      { texto: <Math>6</Math>, correta: true },
      { texto: <Math>8</Math> },
    ],
  },
  {
    pergunta:
      "Qual é o valor de π (pi) aproximado comumente usado em exercícios?",
    alternativas: [
      { texto: <Math>2,17</Math> },
      { texto: <Math>3,14</Math>, correta: true },
      { texto: <Math>3,41</Math> },
      { texto: <Math>4,13</Math> },
    ],
  },
  {
    pergunta: "A soma dos ângulos internos de um triângulo é:",
    alternativas: [
      { texto: <Math>90°</Math> },
      { texto: <Math>180°</Math>, correta: true },
      { texto: <Math>270°</Math> },
      { texto: <Math>360°</Math> },
    ],
  },
  {
    pergunta: "Qual destas expressões é um monômio?",
    alternativas: [
      { texto: <Math>3x² + 1</Math> },
      { texto: <Math>x² - 2x</Math> },
      { texto: <Math>3x²</Math>, correta: true },
      { texto: <Math>x³ + x² + x</Math> },
    ],
  },
  {
    pergunta: "O número 0,25 em fração irredutível é:",
    alternativas: [
      { texto: <Math>25/10</Math> },
      { texto: <Math>1/4</Math>, correta: true },
      { texto: <Math>2/5</Math> },
      { texto: <Math>1/2</Math> },
    ],
  },
];
