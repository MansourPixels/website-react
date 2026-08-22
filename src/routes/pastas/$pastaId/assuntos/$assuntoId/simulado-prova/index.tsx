import { Button, ProgressBar } from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronRight, ListCheck } from "lucide-react";
import { useState, type FormEvent } from "react";

import { NavMenu } from "@/components/NavMenu";
import { AlternativeOption } from "./-components/AlternativeOption";
import { TestSummary } from "./-components/TestSummary";

import { practiceTest } from "@/mocks/practiceTest";
import { alternativeLetter } from "@/utils/alternatives";

export const Route = createFileRoute(
  "/pastas/$pastaId/assuntos/$assuntoId/simulado-prova/",
)({
  component: PracticeTestPage,
});

function PracticeTestPage() {
  const { pastaId, assuntoId } = Route.useParams();
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const total = practiceTest.length;
  const currentQuestion = practiceTest[currentIndex];
  const isLastQuestion = currentIndex === total - 1;
  const answeredCount = isFinished ? total : currentIndex;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedIndex === null) return;

    setAnswers((previous) => [...previous, selectedIndex]);
    setSelectedIndex(null);

    if (isLastQuestion) {
      setIsFinished(true);
      return;
    }

    setCurrentIndex((previous) => previous + 1);
  }

  function restartTest() {
    setCurrentIndex(0);
    setSelectedIndex(null);
    setAnswers([]);
    setIsFinished(false);
  }

  return (
    <main className="p-6 gap-8 flex flex-col content-bg-orange-200 flex-1 justify-between">
      <div>
        <NavMenu
          title="Simulado de prova"
          hasBackButton
          className="text-center pr-12 mb-3"
        />
        <ProgressBar
          aria-label="Progresso"
          size="lg"
          value={(answeredCount / total) * 100}
        >
          <ProgressBar.Track>
            <ProgressBar.Fill className="bg-orange-600" />
          </ProgressBar.Track>
        </ProgressBar>
      </div>

      {isFinished ? (
        <TestSummary
          questions={practiceTest}
          answers={answers}
          onRestart={restartTest}
          onFinish={() =>
            navigate({
              to: "/pastas/$pastaId/assuntos/$assuntoId",
              params: { pastaId, assuntoId },
            })
          }
        />
      ) : (
        <form
          id="simulado"
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 flex-1 justify-between"
        >
          <fieldset className="flex flex-col gap-4">
            <legend className="sr-only">{currentQuestion.pergunta}</legend>
            <div>
              <span className="opacity-70">
                Pergunta {String(currentIndex + 1).padStart(2, "0")} de{" "}
                {String(total).padStart(2, "0")}
              </span>
              <h2 className="text-2xl font-semibold" aria-hidden>
                {currentQuestion.pergunta}
              </h2>
            </div>

            <ul className="flex flex-col gap-3">
              {currentQuestion.alternativas.map((alternativa, index) => (
                <li key={alternativeLetter(index)}>
                  <AlternativeOption
                    letter={alternativeLetter(index)}
                    isSelected={selectedIndex === index}
                    onSelect={() => setSelectedIndex(index)}
                  >
                    {alternativa.texto}
                  </AlternativeOption>
                </li>
              ))}
            </ul>
          </fieldset>

          <Button
            type="submit"
            fullWidth
            size="lg"
            isDisabled={selectedIndex === null}
          >
            {isLastQuestion ? <ListCheck /> : <ChevronRight />}
            {isLastQuestion ? "Finalizar simulado" : "Próxima pergunta"}
          </Button>
        </form>
      )}
    </main>
  );
}
