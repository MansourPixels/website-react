import { AlternativeOption } from "@/components/AlternativeOption";
import { FlashCard } from "@/components/FlashCard";
import { Math } from "@/components/Math";
import { flashCards } from "@/mocks/flashCards";
import { practiceTest } from "@/mocks/practiceTest";
import { alternativeLetter } from "@/utils/alternatives";
import { difficulties } from "@/utils/difficulties";
import { Button } from "@heroui/react";
import { FileText, ListCheck, Zap } from "lucide-react";
import { useState } from "react";
import { ModeHeader } from "./ModeHeader";

const sampleCard = flashCards[0];
const sampleQuestion = practiceTest[2];

export function StudyModes() {
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState("B");

  return (
    <section
      id="modos"
      className="mx-auto w-full max-w-6xl scroll-mt-28 px-6 py-8 md:px-8 lg:py-12"
    >
      <header className="max-w-2xl">
        <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
          Três jeitos de estudar a mesma foto.
        </h2>
        <p className="mt-4 leading-relaxed text-pretty text-muted">
          Você escolhe o modo dentro do assunto. Os três leem o conteúdo que
          você capturou, inclusive a notação matemática.
        </p>
      </header>

      <div className="mt-10 grid gap-4 lg:grid-cols-12 lg:gap-5">
        <article className="reveal flex flex-col gap-5 rounded-3xl bg-white p-5 shadow-surface md:p-6 lg:col-span-5 lg:row-span-2">
          <ModeHeader
            icon={Zap}
            iconClass="bg-emerald-500"
            name="Flash cards"
            description="Repetição espaçada, no seu ritmo"
          />

          <div className="content-bg-emerald-200 flex flex-1 flex-col gap-4 rounded-2xl p-4">
            <FlashCard
              question={sampleCard.pergunta}
              answer={sampleCard.resposta}
              position={1}
              total={flashCards.length}
              isAnswerRevealed={isAnswerRevealed}
            />

            <Button
              variant="primary"
              fullWidth
              onPress={() => setIsAnswerRevealed(!isAnswerRevealed)}
            >
              {isAnswerRevealed ? "Ver a pergunta" : "Revelar resposta"}
            </Button>

            <div className="flex items-start justify-between gap-2">
              {difficulties.map(({ id, label, image }) => (
                <p
                  key={id}
                  className="flex flex-1 flex-col items-center gap-2 text-sm font-medium"
                >
                  <span className="flex size-14 items-center justify-center rounded-full bg-white shadow-surface">
                    <img src={image} alt="" className="size-9" />
                  </span>
                  {label}
                </p>
              ))}
            </div>
          </div>

          <p className="text-sm leading-relaxed text-pretty text-muted">
            Depois de revelar, você diz o quanto o cartão custou. É isso que
            decide se ele volta amanhã ou daqui a uma semana.
          </p>
        </article>

        <article className="reveal flex flex-col gap-5 rounded-3xl bg-white p-5 shadow-surface md:p-6 lg:col-span-7">
          <ModeHeader
            icon={FileText}
            iconClass="bg-violet-700"
            name="Resumo"
            description="O assunto inteiro, condensado para leitura"
          />

          <div className="content-bg-purple-200 rounded-2xl p-4">
            <div className="rounded-2xl bg-white p-5 text-sm leading-relaxed shadow-surface md:text-base">
              <p>
                Uma equação de terceiro grau é toda sentença que pode ser
                reduzida à forma:
              </p>
              <p className="my-4 text-center text-lg">
                <Math>ax³ + bx² + cx + d = 0</Math>
              </p>
              <p className="text-muted">
                Onde <Math>a</Math>, <Math>b</Math>, <Math>c</Math> e{" "}
                <Math>d</Math> são números reais, com a condição obrigatória de
                que <Math>a ≠ 0</Math>.
              </p>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-pretty text-muted">
            Fórmula sai em serifa matemática, não em fonte de interface. É a
            diferença entre ler um resumo e decifrar um.
          </p>
        </article>

        <article className="reveal flex flex-col gap-5 rounded-3xl bg-white p-5 shadow-surface md:p-6 lg:col-span-7">
          <ModeHeader
            icon={ListCheck}
            iconClass="bg-orange-600"
            name="Simulado de prova"
            description="Alternativas, correção e resultado no fim"
          />

          <div className="content-bg-orange-200 rounded-2xl p-4">
            <p className="font-semibold text-pretty">
              {sampleQuestion.pergunta}
            </p>

            <fieldset className="mt-4 flex flex-col gap-2">
              <legend className="sr-only">
                Exemplo de alternativas do simulado
              </legend>
              {sampleQuestion.alternativas.map(({ texto }, index) => {
                const letter = alternativeLetter(index);

                return (
                  <AlternativeOption
                    key={letter}
                    letter={letter}
                    isSelected={selectedLetter === letter}
                    onSelect={() => setSelectedLetter(letter)}
                  >
                    {texto}
                  </AlternativeOption>
                );
              })}
            </fieldset>
          </div>
        </article>
      </div>
    </section>
  );
}
