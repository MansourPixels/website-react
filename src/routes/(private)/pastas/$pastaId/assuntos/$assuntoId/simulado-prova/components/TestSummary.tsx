import { Math as MathText } from "@/components/Math";
import { useFeedback } from "@/hooks/useFeedback";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type {
  GradeResponse,
  QuizOption,
  QuizQuestion,
} from "@/types/api/quiz";
import { Button } from "@heroui/react";
import { Check, RotateCcw, X } from "lucide-react";
import { useEffect, useState } from "react";

/** Intervalo entre a entrada de um resultado e a do próximo. */
const REVEAL_INTERVAL = 90;

interface TestSummaryProps {
  questions: QuizQuestion[];
  answers: Map<string, QuizOption>;
  result: GradeResponse;
  onRestart: () => void;
  onFinish: () => void;
}

export function TestSummary({
  questions,
  answers,
  result,
  onRestart,
  onFinish,
}: TestSummaryProps) {
  const { correctCount, totalQuestions } = result;
  const percentage =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const correctByQuestionId = new Map(
    result.results.map((item) => [item.questionId, item.correct]),
  );

  const feedback = useFeedback();
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  // Os resultados chegam todos de uma vez da API; revelar um a um é o que dá
  // ao aluno tempo de registrar cada acerto e cada erro.
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      setRevealedCount(questions.length);
      return;
    }

    setRevealedCount(0);

    let index = 0;
    const timer = setInterval(() => {
      const question = questions[index];

      if (question !== undefined) {
        feedback(
          (correctByQuestionId.get(question.id) ?? false)
            ? "simulado-resposta-correta"
            : "simulado-resposta-incorreta",
        );
      }

      index += 1;
      setRevealedCount(index);

      if (index >= questions.length) clearInterval(timer);
    }, REVEAL_INTERVAL);

    return () => clearInterval(timer);
  }, [result, questions, prefersReducedMotion, feedback]);

  return (
    <>
      <section className="flex flex-col gap-6">
        <div className="bg-white rounded-2xl shadow-surface p-6 flex flex-col items-center gap-2 text-center">
          <h2 className="text-3xl font-semibold">Simulado concluído!</h2>
          <p className="text-5xl font-semibold text-orange-600">
            {correctCount}
            <span className="text-2xl opacity-50">/{totalQuestions}</span>
          </p>
          <p className="opacity-70">
            Você acertou {percentage}% das questões deste simulado.
          </p>
        </div>

        <ul className="flex flex-col gap-2">
          {questions.slice(0, revealedCount).map((question, index) => {
            const selectedOption = answers.get(question.id) ?? null;
            const isCorrect = correctByQuestionId.get(question.id) ?? false;

            return (
              <li
                key={question.id}
                className="celebrate bg-white rounded-2xl shadow-surface p-4 flex gap-3"
              >
                <span
                  className={`size-7 shrink-0 rounded-full flex items-center justify-center text-white ${
                    isCorrect ? "bg-emerald-500" : "bg-red-500"
                  }`}
                >
                  {isCorrect ? (
                    <Check className="size-4" />
                  ) : (
                    <X className="size-4" />
                  )}
                </span>
                <div className="flex-1">
                  <p className="font-medium">
                    {String(index + 1).padStart(2, "0")}.{" "}
                    <MathText>{question.question}</MathText>
                  </p>
                  <p className="text-sm opacity-70">
                    Sua resposta:{" "}
                    {selectedOption === null
                      ? "não respondida"
                      : selectedOption}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <footer className="flex flex-col gap-3">
        <Button fullWidth size="lg" onClick={onRestart}>
          <RotateCcw />
          Refazer simulado
        </Button>
        <Button fullWidth size="lg" variant="tertiary" onClick={onFinish}>
          Voltar ao assunto
        </Button>
      </footer>
    </>
  );
}
