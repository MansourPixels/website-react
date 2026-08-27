import { Button, ProgressBar, Spinner, buttonVariants } from "@heroui/react";
import { Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { ApiError } from "@/api/client";
import { listFlashcards } from "@/api/flashcards";
import { DifficultyButton } from "@/components/DifficultyButton";
import { FlashCard } from "@/components/FlashCard";
import { Math } from "@/components/Math";
import { NavMenu } from "@/components/NavMenu";
import type { Flashcard } from "@/types/api/flashcard";
import { difficulties, type Difficulty } from "@/utils/difficulties";
import { SessionSummary } from "./components/SessionSummary";

export default function FlashCardsPage() {
  const { pastaId, assuntoId } = useParams<"pastaId" | "assuntoId">() as {
    pastaId: string;
    assuntoId: string;
  };
  const navigate = useNavigate();

  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [counts, setCounts] = useState({
    dificil: 0,
    medio: 0,
    facil: 0,
  });

  useEffect(() => {
    let cancelled = false;

    listFlashcards(assuntoId)
      .then((result) => {
        if (!cancelled) setFlashcards(result);
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        setLoadError(
          error instanceof ApiError
            ? error.detail
            : "Não foi possível carregar os flash cards. Tente novamente.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [assuntoId]);

  const total = flashcards?.length ?? 0;
  const currentCard = flashcards?.[currentIndex] ?? null;
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
    <main className="content-bg-emerald-200 flex-1 flex flex-col">
      <div className="p-6 md:p-8 gap-8 flex flex-col flex-1 justify-between w-full max-w-2xl mx-auto">
        <div>
          <NavMenu
            title="Flash Cards"
            hasBackButton
            className="text-center pr-12 mb-3"
          />
          {flashcards !== null && flashcards.length > 0 ? (
            <ProgressBar
              aria-label="Progresso"
              size="lg"
              value={(answeredCount / total) * 100}
            >
              <ProgressBar.Track>
                <ProgressBar.Fill className="bg-emerald-500" />
              </ProgressBar.Track>
            </ProgressBar>
          ) : null}
        </div>

        {loadError !== null ? (
          <p className="text-danger text-center py-8">{loadError}</p>
        ) : flashcards === null ? (
          <div
            className="flex flex-1 items-center justify-center p-6"
            aria-busy="true"
          >
            <Spinner size="lg" />
            <span className="sr-only">Carregando flash cards</span>
          </div>
        ) : flashcards.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-8 text-center">
            <p className="text-muted">
              Ainda não há flash cards para este assunto. Envie conteúdo
              primeiro para que o Revi IA possa gerá-los.
            </p>
            <Link to="/capturar" className={buttonVariants({})}>
              Capturar material
            </Link>
          </div>
        ) : isFinished ? (
          <SessionSummary
            total={total}
            counts={counts}
            onRestart={restartSession}
            onFinish={() =>
              navigate(`/pastas/${pastaId}/assuntos/${assuntoId}`)
            }
          />
        ) : currentCard !== null ? (
          <>
            <FlashCard
              question={currentCard.front}
              answer={<Math>{currentCard.back}</Math>}
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
        ) : null}
      </div>
    </main>
  );
}
