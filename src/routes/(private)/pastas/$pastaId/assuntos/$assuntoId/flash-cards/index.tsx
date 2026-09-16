import { Button, ProgressBar, Spinner, buttonVariants } from "@heroui/react";
import { Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { ApiError } from "@/api/client";
import { listFlashcards } from "@/api/flashcards";
import { DifficultyButton } from "@/components/DifficultyButton";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { FlashCard } from "@/components/FlashCard";
import { Math } from "@/components/Math";
import { NavMenu } from "@/components/NavMenu";
import { SpeakButton } from "@/components/SpeakButton";
import { useFeedback } from "@/hooks/useFeedback";
import { useSpeech } from "@/hooks/useSpeech";
import type { Flashcard } from "@/types/api/flashcard";
import { difficulties, type Difficulty } from "@/utils/difficulties";
import type { FeedbackEvent } from "@/utils/feedbackCatalog";
import { flashcardSpeech } from "@/utils/speechText";
import { SessionSummary } from "./components/SessionSummary";

const difficultyFeedback: Record<Difficulty, FeedbackEvent> = {
  facil: "flashcard-facil",
  medio: "flashcard-medio",
  dificil: "flashcard-dificil",
};

export default function FlashCardsPage() {
  const { pastaId, assuntoId } = useParams<"pastaId" | "assuntoId">() as {
    pastaId: string;
    assuntoId: string;
  };
  const navigate = useNavigate();
  const feedback = useFeedback();

  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

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

    setFlashcards(null);
    setLoadError(null);

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
  }, [assuntoId, reloadKey]);

  const total = flashcards?.length ?? 0;
  const currentCard = flashcards?.[currentIndex] ?? null;
  const answeredCount = isFinished ? total : currentIndex;

  const { autoPlay, speak, stop } = useSpeech();

  // Leitura automática do card que entrou. Depende só da pergunta: ler a
  // resposta antes de revelá-la entregaria o card.
  const front = currentCard?.front ?? null;

  useEffect(() => {
    if (!autoPlay || front === null || isFinished) return;

    speak(flashcardSpeech({ front }));

    return stop;
  }, [autoPlay, front, isFinished, speak, stop]);

  function handleDifficulty(difficulty: Difficulty) {
    setCounts((previous) => ({
      ...previous,
      [difficulty]: previous[difficulty] + 1,
    }));

    // A última carta encerra a sessão pelo mesmo clique que avançaria — é o
    // único sinal que distingue os dois desfechos.
    if (currentIndex === total - 1) {
      feedback("flashcards-concluido");
      setIsFinished(true);
      return;
    }

    feedback(difficultyFeedback[difficulty]);

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
      <div className="p-6 md:p-8 gap-8 flex flex-col flex-1 justify-between w-full max-w-3xl mx-auto">
        <div>
          <NavMenu
            title="Flash Cards"
            hasBackButton
            className="mb-3"
            action={
              currentCard !== null && !isFinished ? (
                <SpeakButton
                  label={isAnswerRevealed ? "a resposta" : "a pergunta"}
                  text={() =>
                    flashcardSpeech({
                      front: currentCard.front,
                      back: isAnswerRevealed ? currentCard.back : null,
                    })
                  }
                />
              ) : null
            }
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
          <ErrorState onRetry={() => setReloadKey((k) => k + 1)}>
            {loadError}
          </ErrorState>
        ) : flashcards === null ? (
          <div
            className="flex flex-1 items-center justify-center p-6"
            aria-busy="true"
          >
            <Spinner size="lg" />
            <span className="sr-only">Carregando flash cards</span>
          </div>
        ) : flashcards.length === 0 ? (
          <EmptyState
            action={
              <Link
                to="/capturar"
                className={buttonVariants({ variant: "secondary" })}
              >
                Capturar material
              </Link>
            }
          >
            Ainda não há flash cards para este assunto. Envie conteúdo primeiro
            para que o Revi IA possa gerá-los.
          </EmptyState>
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
                  onPress={() => {
                    feedback("flashcard-virar");
                    setIsAnswerRevealed(true);
                  }}
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
