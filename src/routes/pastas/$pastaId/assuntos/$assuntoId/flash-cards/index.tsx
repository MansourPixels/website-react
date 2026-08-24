import { Button, ProgressBar } from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { useState } from "react";

import { NavMenu } from "@/components/NavMenu";
import { DifficultyButton } from "./-components/DificultyButton";
import { FlashCard } from "./-components/FlashCard";
import { SessionSummary } from "./-components/SessionSummary";

import { flashCards } from "@/mocks/flashCards";
import { difficulties, type Difficulty } from "@/utils/difficulties";

export const Route = createFileRoute(
  "/pastas/$pastaId/assuntos/$assuntoId/flash-cards/",
)({
  component: FlashCardsPage,
});

function FlashCardsPage() {
  const { pastaId, assuntoId } = Route.useParams();
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [counts, setCounts] = useState({
    dificil: 0,
    medio: 0,
    facil: 0,
  });

  const total = flashCards.length;
  const currentCard = flashCards[currentIndex];
  const answeredCount = isFinished ? total : currentIndex;

  function handleDifficulty(difficulty: Difficulty) {
    setCounts((previous) => ({
      ...previous,
      [difficulty]: previous[difficulty] + 1,
    }));

    if (currentIndex === total - 1) {
      setIsFinished(true);
      return;
    }

    setIsAnswerRevealed(false);
    setCurrentIndex((previous) => previous + 1);
  }

  function restartSession() {
    setCounts({
      dificil: 0,
      medio: 0,
      facil: 0,
    });
    setCurrentIndex(0);
    setIsAnswerRevealed(false);
    setIsFinished(false);
  }

  return (
    // O banho de cor sangra na largura inteira; a sessão de estudo, não. Um
    // cartão de pergunta esticado em 1920px vira letterbox e some.
    <main className="content-bg-emerald-200 flex-1 flex flex-col">
      <div className="p-6 md:p-8 gap-8 flex flex-col flex-1 justify-between w-full max-w-2xl mx-auto">
        <div>
          <NavMenu
            title="Flash Cards"
            hasBackButton
            className="text-center pr-12 mb-3"
          />
          <ProgressBar
            aria-label="Progresso"
            size="lg"
            value={(answeredCount / total) * 100}
          >
            <ProgressBar.Track>
              <ProgressBar.Fill className="bg-emerald-500" />
            </ProgressBar.Track>
          </ProgressBar>
        </div>

        {isFinished ? (
          <SessionSummary
            total={total}
            counts={counts}
            onRestart={restartSession}
            onFinish={() =>
              navigate({
                to: "/pastas/$pastaId/assuntos/$assuntoId",
                params: { pastaId, assuntoId },
              })
            }
          />
        ) : (
          <>
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
                  onClick={() => setIsAnswerRevealed(true)}
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
        )}
      </div>
    </main>
  );
}
