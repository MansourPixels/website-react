import { Button } from "@heroui/react";
import { Check, ChevronRight, ListCheck, X } from "lucide-react";
import { useState, type FormEvent } from "react";

import { ApiError } from "@/api/client";
import type { MediaSource } from "@/api/mediaSource";
import { AlternativeOption } from "@/components/AlternativeOption";
import { ErrorState } from "@/components/ErrorState";
import { Math as MathText } from "@/components/Math";
import type { GradeResponse, QuizOption, QuizQuestion } from "@/types/api/quiz";
import { reviewMoments } from "@/utils/mediaArtifacts";
import { ArtifactStatus } from "./ArtifactStatus";
import { SeekButton } from "./SeekButton";
import type { ArtifactState } from "./useArtifact";

const OPTION_LETTERS: QuizOption[] = ["A", "B", "C", "D"];

function optionText(question: QuizQuestion, option: QuizOption) {
  return {
    A: question.optionA,
    B: question.optionB,
    C: question.optionC,
    D: question.optionD,
  }[option];
}

interface MediaQuizTabProps {
  source: MediaSource;
  quiz: ArtifactState<QuizQuestion[]>;
  noun?: "áudio" | "vídeo";
  onSeek: (seconds: number) => void;
}

/**
 * O simulado do próprio áudio: uma pergunta por vez, como o da pasta, mas a
 * correção mostra a alternativa certa e leva de volta ao momento do áudio em
 * que ela é explicada.
 */
export function MediaQuizTab({ source, quiz, onSeek, noun = "áudio" }: MediaQuizTabProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<QuizOption | null>(null);
  const [answers, setAnswers] = useState<Map<string, QuizOption>>(new Map());
  const [result, setResult] = useState<GradeResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const questions = quiz.data;

  if (questions === null || quiz.phase !== "ready" || quiz.error !== null) {
    return <ArtifactStatus name="o simulado" state={quiz} noun={noun} />;
  }

  const total = questions.length;
  const current = questions[currentIndex];
  const isLast = currentIndex === total - 1;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selected === null || current === undefined) return;

    const nextAnswers = new Map(answers).set(current.id, selected);

    setAnswers(nextAnswers);
    setSelected(null);

    if (!isLast) {
      setCurrentIndex((index) => index + 1);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Só o que foi respondido: o backend recusa (400) pergunta de outro material,
      // e a que ficou sem resposta ele já dá como errada.
      const graded = await source.gradeQuiz(
        (questions ?? []).flatMap((question) => {
          const selectedOption = nextAnswers.get(question.id);

          return selectedOption === undefined
            ? []
            : [{ questionId: question.id, selectedOption }];
        }),
      );

      setResult(graded);
    } catch (caught) {
      setSubmitError(
        caught instanceof ApiError
          ? caught.detail
          : "Não foi possível enviar o simulado. Tente novamente.",
      );
      // Volta à última pergunta com a alternativa marcada, para tentar de novo.
      setCurrentIndex(total - 1);
      setSelected(nextAnswers.get(current.id) ?? null);
    } finally {
      setIsSubmitting(false);
    }
  }

  function restart() {
    setCurrentIndex(0);
    setSelected(null);
    setAnswers(new Map());
    setResult(null);
    setSubmitError(null);
  }

  if (result !== null) {
    const resultById = new Map(result.results.map((item) => [item.questionId, item]));
    const toReview = reviewMoments(result.results);

    return (
      <section aria-label="Resultado do simulado" className="flex flex-col gap-4">
        <div role="status" className="bg-surface shadow-surface flex flex-col gap-1 rounded-2xl p-4">
          <p className="text-lg font-semibold">
            Você acertou <span className="tabular-nums">{result.correctCount}</span> de{" "}
            <span className="tabular-nums">{result.totalQuestions}</span>.
          </p>
          {toReview.length > 0 ? (
            <p className="text-muted text-sm text-pretty">
              {toReview.length === 1
                ? `Uma resposta errada tem o momento do ${noun} onde ela é explicada.`
                : `${toReview.length} respostas erradas têm o momento do ${noun} onde são explicadas.`}
            </p>
          ) : null}
        </div>

        <ul className="flex flex-col gap-3">
          {questions.map((question, index) => {
            const item = resultById.get(question.id);
            const isCorrect = item?.correct ?? false;
            const chosen = answers.get(question.id) ?? null;
            const correctOption = item?.correctOption;

            return (
              <li key={question.id} className="bg-surface shadow-surface flex gap-3 rounded-2xl p-4">
                <span
                  aria-hidden
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-white ${isCorrect ? "bg-success" : "bg-danger"}`}
                >
                  {isCorrect ? <Check className="size-4" /> : <X className="size-4" />}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="font-medium text-pretty">
                    <span className="tabular-nums">{String(index + 1).padStart(2, "0")}.</span>{" "}
                    <MathText>{question.question}</MathText>
                  </p>
                  <p className="text-sm">
                    <strong>{isCorrect ? "Acertou" : "Errou"}.</strong>{" "}
                    <span className="text-muted">
                      Sua resposta: {chosen ?? "não respondida"}
                    </span>
                  </p>
                  {!isCorrect && correctOption !== undefined ? (
                    <p className="text-sm text-pretty">
                      Alternativa certa: <strong>{correctOption}</strong>.{" "}
                      <MathText>{optionText(question, correctOption)}</MathText>
                    </p>
                  ) : null}
                  {!isCorrect ? (
                    <div>
                      <SeekButton startSeconds={item?.startSeconds} onSeek={onSeek}>
                        Rever este momento
                      </SeekButton>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>

        <Button variant="secondary" onPress={restart}>
          Refazer simulado
        </Button>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2">
          <span className="text-muted tabular-nums">
            Pergunta {String(currentIndex + 1).padStart(2, "0")} de {String(total).padStart(2, "0")}
          </span>
          <span className="sr-only">: </span>
          <h2 className="text-xl font-semibold text-pretty">
            <MathText>{current.question}</MathText>
          </h2>
        </legend>

        <ul className="flex flex-col gap-3">
          {OPTION_LETTERS.map((option) => (
            <li key={option}>
              <AlternativeOption
                letter={option}
                isSelected={selected === option}
                onSelect={() => setSelected(option)}
              >
                <MathText>{optionText(current, option)}</MathText>
              </AlternativeOption>
            </li>
          ))}
        </ul>

        {submitError !== null ? <ErrorState isCompact>{submitError}</ErrorState> : null}
      </fieldset>

      <Button type="submit" fullWidth size="lg" isDisabled={selected === null || isSubmitting}>
        {isLast ? <ListCheck /> : <ChevronRight />}
        {isSubmitting ? "Enviando..." : isLast ? "Finalizar simulado" : "Próxima pergunta"}
      </Button>
    </form>
  );
}
