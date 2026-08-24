import { Math } from "@/components/Math";
import { NavMenu } from "@/components/NavMenu";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/pastas/$pastaId/assuntos/$assuntoId/resumo/",
)({
  component: SummaryPage,
});

function SummaryPage() {
  return (
    <main className="content-bg-purple-200 flex-1 flex flex-col">
      <div className="p-6 md:p-8 gap-8 flex flex-col w-full max-w-3xl mx-auto">
        <NavMenu title="Resumo" hasBackButton className="text-center pr-12" />
        <div className="bg-white p-4 md:p-8 rounded-2xl shadow-surface prose-sm md:prose-base [&_math]:mx-auto prose-headings:font-semibold grid prose-zinc prose-ul:list-disc prose-ol:list-decimal prose-strong:font-semibold prose-h2:mt-4 prose-h2:mb-2">
          <p>
            Uma equação de terceiro grau (ou equação cúbica) é toda sentença
            matemática que pode ser reduzida à forma:
          </p>
          <Math>ax³ + bx² + cx + d = 0</Math>
          <p>
            Onde os coeficientes a, b, c e d são números reais, com a condição
            obrigatória de que <Math>a ≠ 0</Math>
          </p>

          <h2>1. Características Principais</h2>
          <ul>
            <li>
              <strong>Grau:</strong> O maior expoente da incógnita x é 3.
            </li>
            <li>
              <strong>Raízes:</strong> Possui exatamente 3 raízes (que podem ser
              reais ou complexas).
            </li>
            <li>
              <strong>Gráfico:</strong> É representado por uma curva chamada
              parábola cúbica. Diferente da parábola do 2º grau, ela pode mudar
              de concavidade e cruzar o eixo x em até três pontos diferentes.
            </li>
          </ul>

          <h2>2. Relações de Girard</h2>
          <p>
            As relações de Girard permitem relacionar as raízes (
            <Math>r¹,r²,r³</Math>) diretamente com os coeficientes da equação:
          </p>

          <h3>1. Soma das raízes:</h3>
          <Math>r¹ + r² + r³ = -b/a</Math>

          <h3>2. Soma dos produtos das raízes duas a duas:</h3>
          <Math>r¹·r² + r¹·r³ + r²·r³ = c/a</Math>

          <h3>3. Produto das raízes:</h3>
          <Math>r¹·r²·r³ = -d/a</Math>

          <p>
            Essas relações são úteis para descobrir a terceira raiz quando duas
            já são conhecidas, sem precisar resolver a equação novamente.
          </p>

          <h2>3. Métodos de Resolução</h2>
          <ul>
            <li>
              <strong>Equação incompleta:</strong> quando <Math>d = 0</Math>,
              basta colocar <Math>x</Math> em evidência —{" "}
              <Math>x(ax² + bx + c) = 0</Math> — obtendo <Math>x = 0</Math> e as
              raízes da equação do 2º grau restante.
            </li>
            <li>
              <strong>Raízes racionais:</strong> toda raiz racional da equação
              com coeficientes inteiros é da forma <Math>p/q</Math>, em que{" "}
              <Math>p</Math> divide <Math>d</Math> e <Math>q</Math> divide{" "}
              <Math>a</Math>. Testar os divisores de <Math>d</Math> costuma ser
              o caminho mais rápido.
            </li>
            <li>
              <strong>Briot-Ruffini:</strong> encontrada uma raiz{" "}
              <Math>r¹</Math>, a divisão do polinômio por <Math>(x - r¹)</Math>{" "}
              reduz o problema a uma equação do 2º grau, resolvida por Bhaskara.
            </li>
            <li>
              <strong>Fórmula de Cardano:</strong> resolve o caso geral, mas é
              trabalhosa e raramente exigida em provas de nível médio.
            </li>
          </ul>

          <h2>4. Natureza das Raízes</h2>
          <p>
            O discriminante <Math>Δ</Math> da cúbica indica quantas raízes reais
            existem:
          </p>
          <ul>
            <li>
              <Math>Δ &gt; 0</Math>: três raízes reais e distintas.
            </li>
            <li>
              <Math>Δ = 0</Math>: pelo menos duas raízes reais iguais (raiz
              múltipla).
            </li>
            <li>
              <Math>Δ &lt; 0</Math>: uma raiz real e duas complexas conjugadas.
            </li>
          </ul>
          <p>
            Como os coeficientes são reais, as raízes complexas sempre aparecem
            em pares conjugados — por isso nunca existem exatamente duas raízes
            reais.
          </p>

          <h2>5. Exemplo Resolvido</h2>
          <p>
            Resolver <Math>x³ - 6x² + 11x - 6 = 0</Math>:
          </p>
          <ol>
            <li>
              Os divisores de <Math>d = -6</Math> são{" "}
              <Math>±1, ±2, ±3, ±6</Math>. Testando <Math>x = 1</Math>:{" "}
              <Math>1 - 6 + 11 - 6 = 0</Math>, logo <Math>r¹ = 1</Math>.
            </li>
            <li>
              Dividindo por <Math>(x - 1)</Math> com Briot-Ruffini, sobra{" "}
              <Math>x² - 5x + 6 = 0</Math>.
            </li>
            <li>
              Por Bhaskara, <Math>r² = 2</Math> e <Math>r³ = 3</Math>.
            </li>
            <li>
              Conferindo com Girard: <Math>1 + 2 + 3 = 6 = -b/a</Math> e{" "}
              <Math>1·2·3 = 6 = -d/a</Math>. ✔
            </li>
          </ol>

          <h2>6. Pontos de Atenção</h2>
          <ul>
            <li>
              Se <Math>a = 0</Math>, a equação deixa de ser cúbica e passa a ser
              do 2º grau.
            </li>
            <li>
              O gráfico sempre cruza o eixo <Math>x</Math> ao menos uma vez, por
              isso toda cúbica real tem no mínimo uma raiz real.
            </li>
            <li>
              Antes de partir para fórmulas longas, procure fatorações e raízes
              inteiras simples: a maioria dos exercícios é construída para isso.
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
