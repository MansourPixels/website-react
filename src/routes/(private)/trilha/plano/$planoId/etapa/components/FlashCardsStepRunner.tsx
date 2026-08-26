import { DifficultyButton } from "@/components/DifficultyButton";
import { FlashCard } from "@/components/FlashCard";
import type { FlashCardsPlanStep, PlanStep } from "@/mocks/studyPlans";
import { difficulties, type Difficulty } from "@/utils/difficulties";
import { Button, ProgressBar } from "@heroui/react";
import { Zap } from "lucide-react";
import { useState } from "react";

import { StepComplete } from "./StepComplete";

interface FlashCardsStepRunnerProps {
  planId: string;
  planFocus: string;
  step: FlashCardsPlanStep;
  nextStep: PlanStep | null;
  isPlanComplete: boolean;
  onComplete: () => void;
}

const emptyCounts: Record<Difficulty, number> = {
  dificil: 0,
  medio: 0,
  facil: 0,
};

export function FlashCardsStepRunner({
  planId,
  planFocus,
  step,
  nextStep,
  isPlanComplete,
  onComplete,
}: FlashCardsStepRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [counts, setCounts] = useState(emptyCounts);

  const total = step.cards.length;
  const currentCard = step.cards[currentIndex];
  const answeredCount = isFinished ? total : currentIndex;

  function handleDifficulty(difficulty: Difficulty) {
    setCounts((previous) => ({
      ...previous,
      [difficulty]: previous[difficulty] + 1,
    }));

    if (currentIndex === total - 1) {
      onComplete();
      setIsFinished(true);
      return;
    }

    setIsAnswerRevealed(false);
    setCurrentIndex((previous) => previous + 1);
  }

  function restart() {
    setCounts(emptyCounts);
    setCurrentIndex(0);
    setIsAnswerRevealed(false);
    setIsFinished(false);
  }

  if (isFinished) {
    return (
      <StepComplete
        planId={planId}
        planFocus={planFocus}
        stepTitle={`Você revisou os ${total} cartões de ${step.title.toLowerCase()}.`}
        isPlanComplete={isPlanComplete}
        nextStep={nextStep}
        onRestart={restart}
        restartLabel="Refazer os cartões"
      >
        <ul className="grid grid-cols-3 gap-3 w-full max-w-md mx-auto">
          {difficulties.map(({ id, label, image }) => (
            <li
              key={id}
              className="bg-white rounded-2xl shadow-surface p-4 flex flex-col items-center gap-2"
            >
              <img src={image} alt="" className="size-10" />
              <strong className="text-2xl font-semibold tabular-nums">
                {counts[id]}
              </strong>
              <span className="text-sm opacity-70">{label}</span>
            </li>
          ))}
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
          <ProgressBar.Fill className="bg-emerald-500" />
        </ProgressBar.Track>
      </ProgressBar>

      <FlashCard
        question={currentCard.pergunta}
        answer={currentCard.resposta}
        position={currentIndex + 1}
        total={total}
        isAnswerRevealed={isAnswerRevealed}
      />

      <footer className="h-28 short:h-auto flex items-end">
        {!isAnswerRevealed ? (
          <Button
            fullWidth
            size="lg"
            onPress={() => setIsAnswerRevealed(true)}
          >
            <Zap />
            Revelar resposta
          </Button>
        ) : (
          <div className="flex items-center justify-around w-full">
            {difficulties.map(({ id, label, image }) => (
              <DifficultyButton
                key={id}
                image={image}
                label={label}
                onClick={() => handleDifficulty(id)}
              />
            ))}
          </div>
        )}
      </footer>
    </>
  );
}
