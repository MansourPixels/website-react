import { AlternativeOption } from "@/components/AlternativeOption";
import type { PlanStep, PracticePlanStep } from "@/mocks/studyPlans";
import { alternativeLetter } from "@/utils/alternatives";
import { Button, ProgressBar } from "@heroui/react";
import { Check, ChevronRight, ListCheck, X } from "lucide-react";
import { useState, type FormEvent } from "react";

import { StepComplete } from "./StepComplete";

interface PracticeStepRunnerProps {
  planId: string;
  planFocus: string;
  step: PracticePlanStep;
  nextStep: PlanStep | null;
  isPlanComplete: boolean;
  onComplete: () => void;
}

export function PracticeStepRunner({
  planId,
  planFocus,
  step,
  nextStep,
  isPlanComplete,
  onComplete,
}: PracticeStepRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const total = step.questions.length;
  const currentQuestion = step.questions[currentIndex];
  const isLastQuestion = currentIndex === total - 1;
  const answeredCount = isFinished ? total : currentIndex;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedIndex === null) return;

    setAnswers((previous) => [...previous, selectedIndex]);
    setSelectedIndex(null);

    if (isLastQuestion) {
      onComplete();
      setIsFinished(true);
      return;
    }

    setCurrentIndex((previous) => previous + 1);
  }

  function restart() {
    setCurrentIndex(0);
    setSelectedIndex(null);
    setAnswers([]);
    setIsFinished(false);
  }

  if (isFinished) {
    const correctCount = step.questions.filter(
      (question, index) => question.alternativas[answers[index]]?.correta,
    ).length;
    const percentage = Math.round((correctCount / total) * 100);

    return (
      <StepComplete
        planId={planId}
        planFocus={planFocus}
        stepTitle={`Você acertou ${percentage}% das questões desta etapa.`}
        isPlanComplete={isPlanComplete}
        nextStep={nextStep}
        onRestart={restart}
        restartLabel="Refazer o simulado"
      >
        <ul className="flex flex-col gap-2">
          {step.questions.map((question, index) => {
            const selected = question.alternativas[answers[index]];
            const isCorrect = Boolean(selected?.correta);
            const correctIndex = question.alternativas.findIndex(
              (alternativa) => alternativa.correta,
            );

            return (
              <li
                key={question.pergunta}
                className="bg-white rounded-2xl shadow-surface p-4 flex gap-3 text-left"
              >
                <span
                  aria-hidden
                  className={`size-7 shrink-0 rounded-full flex items-center justify-center text-white ${
                    isCorrect ? "bg-success" : "bg-danger"
                  }`}
                >
                  {isCorrect ? (
                    <Check className="size-4" />
                  ) : (
                    <X className="size-4" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-pretty">
                    <span className="tabular-nums">
                      {String(index + 1).padStart(2, "0")}.
                    </span>{" "}
                    {question.pergunta}
                    <span className="sr-only">
                      : {isCorrect ? "você acertou" : "você errou"}
                    </span>
                  </p>
                  <p className="text-sm opacity-70 text-pretty">
                    Sua resposta: {alternativeLetter(answers[index])}.{" "}
                    {selected?.texto}
                  </p>
                  {!isCorrect ? (
                    <p className="text-sm text-success text-pretty">
                      Resposta correta: {alternativeLetter(correctIndex)}.{" "}
                      {question.alternativas[correctIndex]?.texto}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </StepComplete>
    );
  }

  return (
    <>
      <ProgressBar
        aria-label="Progresso da etapa"
        size="lg"
        value={(answeredCount / total) * 100}
      >
        <ProgressBar.Track>
          <ProgressBar.Fill className="bg-orange-600" />
        </ProgressBar.Track>
      </ProgressBar>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 flex-1 justify-between"
      >
        <fieldset className="flex flex-col gap-4">
          <legend className="sr-only">{currentQuestion.pergunta}</legend>
          <div>
            <span className="opacity-70 tabular-nums">
              Pergunta {String(currentIndex + 1).padStart(2, "0")} de{" "}
              {String(total).padStart(2, "0")}
            </span>
            <h2 className="text-2xl font-semibold text-pretty" aria-hidden>
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
          {isLastQuestion ? "Finalizar etapa" : "Próxima pergunta"}
        </Button>
      </form>
    </>
  );
}
