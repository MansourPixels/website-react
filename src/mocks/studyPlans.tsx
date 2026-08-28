import { Math } from "@/components/Math";
import type { FlashCardData } from "@/mocks/flashCards";
import { mindMap, type MindMapData } from "@/mocks/mindMap";
import type { PracticeTestQuestion } from "@/mocks/practiceTest";
import type { ReactNode } from "react";

export type PlanStepKind =
  | "resumo"
  | "flash-cards"
  | "simulado"
  | "mapa-mental";

interface PlanStepBase {
  id: string;
  title: string;
  goal: string;
  minutes: number;
}

export interface SummaryPlanStep extends PlanStepBase {
  kind: "resumo";
  content: ReactNode;
}

export interface FlashCardsPlanStep extends PlanStepBase {
  kind: "flash-cards";
  cards: FlashCardData[];
}

export interface PracticePlanStep extends PlanStepBase {
  kind: "simulado";
  questions: PracticeTestQuestion[];
}

export interface MindMapPlanStep extends PlanStepBase {
  kind: "mapa-mental";
  map: MindMapData;
}

export type PlanStep =
  | SummaryPlanStep
  | FlashCardsPlanStep
  | PracticePlanStep
  | MindMapPlanStep;

export interface StudyPlan {
  id: string;
  discipline: string;
  focus: string;
  description: string;
  steps: PlanStep[];
}

export const studyPlans: StudyPlan[] = [
  {
    id: "portugues-redacao",
    discipline: "Português",
    focus: "Produção textual de redações",
    description:
      "Percebemos que a produção textual de redações precisa de um pouco mais de atenção. Com treino e dedicação, você pode evoluir bastante nessa habilidade!",
    steps: [
      {
        id: "estrutura",
        kind: "resumo",
        title: "A estrutura que sustenta o texto",
        goal: "Entender o que cada parágrafo precisa entregar antes de escrever.",
        minutes: 8,
        content: (
          <>
            <p>
              A dissertação-argumentativa não é uma opinião solta sobre o tema.
              Ela é uma <strong>tese</strong> defendida por{" "}
              <strong>argumentos</strong>, e cada argumento é comprovado por um{" "}
              <strong>repertório</strong> que veio de fora do seu texto.
            </p>

            <h2>1. Os quatro elementos</h2>
            <ul>
              <li>
                <strong>Tese:</strong> a resposta que você dá ao tema. Aparece
                na introdução e não muda até a conclusão.
              </li>
              <li>
                <strong>Argumento:</strong> a razão que sustenta a tese. Um por
                parágrafo de desenvolvimento.
              </li>
              <li>
                <strong>Repertório:</strong> o dado externo que comprova o
                argumento. Lei, obra, pesquisa, fato histórico.
              </li>
              <li>
                <strong>Proposta de intervenção:</strong> o que fazer sobre o
                problema. Fecha o texto.
              </li>
            </ul>

            <h2>2. O desenho dos quatro parágrafos</h2>
            <ol>
              <li>
                <strong>Introdução:</strong> contextualiza o tema e declara a
                tese na última frase.
              </li>
              <li>
                <strong>Desenvolvimento 1:</strong> primeiro argumento,
                repertório, e a amarração de volta na tese.
              </li>
              <li>
                <strong>Desenvolvimento 2:</strong> segundo argumento, de outro
                ângulo, com repertório de outra área.
              </li>
              <li>
                <strong>Conclusão:</strong> retoma a tese e apresenta a proposta
                de intervenção completa.
              </li>
            </ol>

            <h2>3. A proposta de intervenção tem cinco peças</h2>
            <p>
              Faltando qualquer uma delas, a proposta fica incompleta:{" "}
              <strong>agente</strong> (quem faz), <strong>ação</strong> (o que
              faz), <strong>meio</strong> (como faz),{" "}
              <strong>finalidade</strong> (para quê) e{" "}
              <strong>detalhamento</strong> (o detalhe que prova que você pensou
              na execução).
            </p>

            <h2>4. Onde a nota costuma escapar</h2>
            <ul>
              <li>
                Tese declarada na introdução e esquecida no desenvolvimento.
              </li>
              <li>
                Repertório citado sem ligação explícita com o argumento. Citar
                não é usar.
              </li>
              <li>
                Proposta de intervenção genérica, do tipo "o governo deve
                investir em educação", sem meio nem detalhamento.
              </li>
              <li>
                Parágrafos que começam sem conectivo, o que quebra a coesão
                avaliada na Competência 4.
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "repertorio",
        kind: "flash-cards",
        title: "Repertório e coesão",
        goal: "Fixar os conceitos que a banca cobra em toda correção.",
        minutes: 6,
        cards: [
          {
            pergunta: "O que é a tese de uma dissertação-argumentativa?",
            resposta: (
              <>
                É a resposta que você dá ao tema, declarada ao final da
                introdução e sustentada por todo o restante do texto.
              </>
            ),
          },
          {
            pergunta: "Qual é a diferença entre argumento e repertório?",
            resposta: (
              <>
                O argumento é a razão que sustenta a tese. O repertório é o dado
                externo, como obra, lei, pesquisa ou fato histórico, que
                comprova esse argumento.
              </>
            ),
          },
          {
            pergunta:
              "Quais são os cinco elementos de uma proposta de intervenção completa?",
            resposta: (
              <>
                Agente, ação, meio, finalidade e detalhamento. Faltando um
                deles, a proposta fica incompleta.
              </>
            ),
          },
          {
            pergunta: "O que significa dizer que um repertório é produtivo?",
            resposta: (
              <>
                Significa que ele está explicitamente ligado ao argumento que
                sustenta a tese. Repertório apenas citado, sem essa ligação, não
                é considerado produtivo.
              </>
            ),
          },
          {
            pergunta: "Por que os conectivos pesam na avaliação de coesão?",
            resposta: (
              <>
                Porque são eles que explicitam a relação lógica entre períodos e
                parágrafos. Sem conectivo, o leitor precisa adivinhar se a ideia
                seguinte soma, contrapõe ou conclui.
              </>
            ),
          },
        ],
      },
      {
        id: "diagnostico",
        kind: "simulado",
        title: "Reconhecer tese e argumento",
        goal: "Testar se você identifica as peças em textos que não são seus.",
        minutes: 7,
        questions: [
          {
            pergunta: "Em qual parte da redação a tese deve ser declarada?",
            alternativas: [
              { texto: "No primeiro período da introdução" },
              { texto: "Ao final da introdução", correta: true },
              { texto: "No segundo parágrafo de desenvolvimento" },
              { texto: "Apenas na conclusão" },
            ],
          },
          {
            pergunta:
              "Qual destas é uma proposta de intervenção completa segundo os cinco elementos?",
            alternativas: [
              { texto: "O governo deve investir mais em educação." },
              { texto: "A sociedade precisa se conscientizar do problema." },
              {
                texto:
                  "O Ministério da Educação deve criar oficinas de leitura nas escolas públicas, por meio de parceria com bibliotecas municipais, a fim de ampliar o repertório dos estudantes, priorizando turmas do ensino médio noturno.",
                correta: true,
              },
              { texto: "É urgente que medidas sejam tomadas com brevidade." },
            ],
          },
          {
            pergunta:
              "Um texto cita a Constituição Federal mas nunca relaciona a citação ao argumento do parágrafo. O que aconteceu?",
            alternativas: [
              { texto: "O repertório foi usado de forma produtiva" },
              {
                texto: "O repertório ficou improdutivo, porque não foi ligado ao argumento",
                correta: true,
              },
              { texto: "O texto ganhou nota máxima em repertório" },
              { texto: "A tese foi automaticamente comprovada" },
            ],
          },
          {
            pergunta:
              "Qual conectivo indica contraposição entre duas ideias?",
            alternativas: [
              { texto: "Portanto" },
              { texto: "Além disso" },
              { texto: "Entretanto", correta: true },
              { texto: "Assim sendo" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "geografia-clima",
    discipline: "Geografia",
    focus: "Climatologia e biomas brasileiros",
    description:
      "As questões de climatologia foram as que geraram mais dúvidas. Revisar os biomas junto com os tipos de clima ajuda a fixar os dois assuntos de uma vez.",
    steps: [
      {
        id: "clima-bioma",
        kind: "resumo",
        title: "Clima e bioma, lidos juntos",
        goal: "Entender por que cada bioma aparece onde aparece.",
        minutes: 9,
        content: (
          <>
            <p>
              Bioma não é sorteio. Cada um ocupa a região onde o{" "}
              <strong>regime de chuva</strong> e a{" "}
              <strong>faixa de temperatura</strong> permitem aquele tipo de
              vegetação. Estudar os dois separados é o que faz a questão
              parecer difícil.
            </p>

            <h2>1. Os climas dominantes</h2>
            <ul>
              <li>
                <strong>Equatorial:</strong> quente o ano inteiro, chuva
                abundante e bem distribuída, baixa amplitude térmica.
              </li>
              <li>
                <strong>Tropical:</strong> duas estações marcadas, verão chuvoso
                e inverno seco.
              </li>
              <li>
                <strong>Semiárido:</strong> chuvas escassas e irregulares,
                concentradas em poucos meses.
              </li>
              <li>
                <strong>Subtropical:</strong> as quatro estações definidas,
                chuva distribuída, invernos frios.
              </li>
            </ul>

            <h2>2. O bioma que cada clima sustenta</h2>
            <ul>
              <li>
                <strong>Amazônia</strong> sobre clima equatorial. Floresta
                densa, latifoliada e perene, porque nunca falta água.
              </li>
              <li>
                <strong>Cerrado</strong> sobre clima tropical. Árvores de
                troncos retorcidos e raízes profundas, adaptadas à estação seca
                e ao fogo natural.
              </li>
              <li>
                <strong>Caatinga</strong> sobre clima semiárido. Vegetação
                xerófila, caducifólia, que perde as folhas para reduzir a perda
                de água.
              </li>
              <li>
                <strong>Mata Atlântica</strong> sobre clima tropical úmido de
                litoral, com chuvas orográficas provocadas pelo relevo.
              </li>
              <li>
                <strong>Pampa</strong> sobre clima subtropical. Campos e
                gramíneas, sem cobertura florestal contínua.
              </li>
              <li>
                <strong>Pantanal</strong> sobre clima tropical, em uma planície
                de inundação sazonal que alaga na cheia e seca na vazante.
              </li>
            </ul>

            <h2>3. A pergunta que a prova costuma fazer</h2>
            <p>
              A banca raramente pede o nome do bioma. Ela descreve a vegetação
              ou o regime de chuva e pede a conclusão. Ler a descrição
              procurando <strong>água</strong> e <strong>temperatura</strong>{" "}
              resolve a maioria dos casos.
            </p>

            <h2>4. Confusões frequentes</h2>
            <ul>
              <li>
                Caatinga e Cerrado não são o mesmo. A Caatinga perde as folhas
                por falta de água. O Cerrado mantém folhagem dura e raiz
                profunda.
              </li>
              <li>
                Pantanal não é bioma de clima próprio. É uma planície alagável
                dentro do domínio tropical.
              </li>
              <li>
                Semiárido não significa ausência de chuva, e sim chuva
                concentrada e irregular.
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "biomas",
        kind: "flash-cards",
        title: "Bioma por bioma",
        goal: "Associar cada vegetação ao clima que a explica.",
        minutes: 6,
        cards: [
          {
            pergunta:
              "Que característica da vegetação da Caatinga responde à falta de água?",
            resposta: (
              <>
                Ela é caducifólia e xerófila: perde as folhas na seca para
                reduzir a transpiração e armazena água nos caules.
              </>
            ),
          },
          {
            pergunta: "Qual clima sustenta a floresta amazônica?",
            resposta: (
              <>
                O clima equatorial: quente o ano inteiro, com chuva abundante e
                bem distribuída, e baixa amplitude térmica.
              </>
            ),
          },
          {
            pergunta:
              "Por que as árvores do Cerrado têm raízes muito profundas?",
            resposta: (
              <>
                Porque o clima tropical tem uma estação seca marcada. As raízes
                profundas alcançam o lençol freático quando a chuva cessa.
              </>
            ),
          },
          {
            pergunta: "O que são chuvas orográficas?",
            resposta: (
              <>
                São as chuvas provocadas pelo relevo, quando o ar úmido é
                forçado a subir uma encosta, esfria e condensa. Explicam a
                umidade da Mata Atlântica no litoral.
              </>
            ),
          },
          {
            pergunta: "O que caracteriza o regime de água do Pantanal?",
            resposta: (
              <>
                A inundação sazonal. A planície alaga no período de cheia e
                perde a água na vazante, o que define toda a vida da região.
              </>
            ),
          },
        ],
      },
      {
        id: "aplicacao",
        kind: "simulado",
        title: "Clima e bioma na prática",
        goal: "Ler a descrição e chegar ao bioma sem o nome dado.",
        minutes: 7,
        questions: [
          {
            pergunta:
              "Vegetação que perde as folhas na estação seca, com caules capazes de armazenar água. Qual é o bioma?",
            alternativas: [
              { texto: "Cerrado" },
              { texto: "Caatinga", correta: true },
              { texto: "Pampa" },
              { texto: "Mata Atlântica" },
            ],
          },
          {
            pergunta:
              "Qual clima apresenta a menor amplitude térmica anual entre os listados?",
            alternativas: [
              { texto: "Subtropical" },
              { texto: "Semiárido" },
              { texto: "Equatorial", correta: true },
              { texto: "Tropical de altitude" },
            ],
          },
          {
            pergunta:
              "Campos de gramíneas sob clima com as quatro estações bem definidas e invernos frios. Qual é o bioma?",
            alternativas: [
              { texto: "Pampa", correta: true },
              { texto: "Cerrado" },
              { texto: "Pantanal" },
              { texto: "Amazônia" },
            ],
          },
          {
            pergunta: "O que define o clima semiárido brasileiro?",
            alternativas: [
              { texto: "Ausência total de chuva durante o ano" },
              {
                texto: "Chuvas escassas, irregulares e concentradas em poucos meses",
                correta: true,
              },
              { texto: "Chuva bem distribuída e alta umidade" },
              { texto: "Invernos rigorosos com geada frequente" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "matematica-cubica",
    discipline: "Matemática",
    focus: "Equações do terceiro grau",
    description:
      "Você vai bem em matemática, mas as equações do terceiro grau ainda custam tempo. Um simulado curto por dia deve resolver.",
    steps: [
      {
        id: "girard",
        kind: "resumo",
        title: "Girard e o caminho curto",
        goal: "Trocar a fórmula longa por fatoração e teste de raízes.",
        minutes: 8,
        content: (
          <>
            <p>
              Quase toda cúbica que cai em prova foi construída para ter{" "}
              <strong>raiz inteira</strong>. Procurar essa raiz custa menos
              tempo do que qualquer fórmula geral.
            </p>

            <h2>1. A forma e a condição</h2>
            <Math>ax³ + bx² + cx + d = 0</Math>
            <p>
              com <Math>a ≠ 0</Math>. Se <Math>a = 0</Math>, a equação deixa de
              ser cúbica.
            </p>

            <h2>2. Relações de Girard</h2>
            <p>
              Ligam as raízes <Math>r¹, r², r³</Math> diretamente aos
              coeficientes, sem resolver nada:
            </p>
            <Math>r¹ + r² + r³ = -b/a</Math>
            <Math>r¹·r² + r¹·r³ + r²·r³ = c/a</Math>
            <Math>r¹·r²·r³ = -d/a</Math>
            <p>
              Sabendo duas raízes, a terceira sai por subtração ou divisão. É o
              atalho que mais economiza tempo.
            </p>

            <h2>3. A ordem que resolve rápido</h2>
            <ol>
              <li>
                Se <Math>d = 0</Math>, coloque <Math>x</Math> em evidência.
                Uma raiz é <Math>x = 0</Math> e sobra uma equação do 2º grau.
              </li>
              <li>
                Caso contrário, teste os divisores de <Math>d</Math>. Toda raiz
                racional tem a forma <Math>p/q</Math>, com <Math>p</Math>{" "}
                dividindo <Math>d</Math> e <Math>q</Math> dividindo{" "}
                <Math>a</Math>.
              </li>
              <li>
                Achada uma raiz <Math>r¹</Math>, divida por{" "}
                <Math>(x - r¹)</Math> com Briot-Ruffini. Sobra uma quadrática.
              </li>
              <li>Resolva a quadrática por Bhaskara e confira com Girard.</li>
            </ol>

            <h2>4. Natureza das raízes</h2>
            <ul>
              <li>
                <Math>Δ &gt; 0</Math>: três raízes reais e distintas.
              </li>
              <li>
                <Math>Δ = 0</Math>: pelo menos duas raízes reais iguais.
              </li>
              <li>
                <Math>Δ &lt; 0</Math>: uma raiz real e duas complexas
                conjugadas.
              </li>
            </ul>
            <p>
              Como os coeficientes são reais, raízes complexas sempre aparecem
              em pares. Por isso nunca existem exatamente duas raízes reais.
            </p>
          </>
        ),
      },
      {
        id: "panorama",
        kind: "mapa-mental",
        title: "O mapa da cúbica",
        goal: "Ver como coeficientes, Girard e resolução se conectam.",
        minutes: 5,
        map: mindMap,
      },
      {
        id: "raizes",
        kind: "flash-cards",
        title: "Raízes e coeficientes",
        goal: "Recuperar cada relação sem consultar o resumo.",
        minutes: 6,
        cards: [
          {
            pergunta: "Quanto vale a soma das raízes de uma cúbica?",
            resposta: (
              <>
                <Math>r¹ + r² + r³ = -b/a</Math>, pela primeira relação de
                Girard.
              </>
            ),
          },
          {
            pergunta: "Quanto vale o produto das raízes de uma cúbica?",
            resposta: (
              <>
                <Math>r¹·r²·r³ = -d/a</Math>, pela terceira relação de Girard.
              </>
            ),
          },
          {
            pergunta:
              "Onde procurar as raízes racionais de uma cúbica de coeficientes inteiros?",
            resposta: (
              <>
                Entre as frações <Math>p/q</Math>, com <Math>p</Math> dividindo{" "}
                <Math>d</Math> e <Math>q</Math> dividindo <Math>a</Math>. Na
                prática, testar os divisores de <Math>d</Math> resolve.
              </>
            ),
          },
          {
            pergunta:
              "Por que uma cúbica de coeficientes reais nunca tem exatamente duas raízes reais?",
            resposta: (
              <>
                Porque raízes complexas sempre aparecem em pares conjugados.
                Sobrando duas reais, a terceira também seria real.
              </>
            ),
          },
          {
            pergunta:
              "O que fazer primeiro ao ver a equação x³ - 4x² + 3x = 0?",
            resposta: (
              <>
                Colocar <Math>x</Math> em evidência, já que{" "}
                <Math>d = 0</Math>. Isso dá <Math>x = 0</Math> e{" "}
                <Math>x² - 4x + 3 = 0</Math>.
              </>
            ),
          },
        ],
      },
      {
        id: "resolucao",
        kind: "simulado",
        title: "Resolver sem fórmula longa",
        goal: "Aplicar Girard e Briot-Ruffini contra o relógio.",
        minutes: 7,
        questions: [
          {
            pergunta:
              "Na equação x³ - 6x² + 11x - 6 = 0, quanto vale a soma das raízes?",
            alternativas: [
              { texto: <Math>-6</Math> },
              { texto: <Math>6</Math>, correta: true },
              { texto: <Math>11</Math> },
              { texto: <Math>-11</Math> },
            ],
          },
          {
            pergunta:
              "Duas raízes de x³ - 6x² + 11x - 6 = 0 são 1 e 2. Qual é a terceira?",
            alternativas: [
              { texto: <Math>-3</Math> },
              { texto: <Math>0</Math> },
              { texto: <Math>3</Math>, correta: true },
              { texto: <Math>6</Math> },
            ],
          },
          {
            pergunta: "Qual é o primeiro passo para resolver 2x³ - 8x = 0?",
            alternativas: [
              { texto: "Aplicar a fórmula de Cardano" },
              { texto: "Colocar 2x em evidência", correta: true },
              { texto: "Dividir por (x - 1) com Briot-Ruffini" },
              { texto: "Calcular o discriminante" },
            ],
          },
          {
            pergunta:
              "Uma cúbica de coeficientes reais tem discriminante negativo. Quantas raízes reais ela possui?",
            alternativas: [
              { texto: "Nenhuma" },
              { texto: "Uma", correta: true },
              { texto: "Duas" },
              { texto: "Três" },
            ],
          },
        ],
      },
    ],
  },
];

export function findStudyPlan(planId: string) {
  return studyPlans.find((plan) => plan.id === planId);
}
