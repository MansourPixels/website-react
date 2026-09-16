import { Math as MathText } from "@/components/Math";
import { useFeedback } from "@/hooks/useFeedback";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type {
  GradeResponse,
  QuizOption,
  QuizQuestion,
} from "@/types/api/quiz";
import { Check, ListCheck, X } from "lucide-react";
import { useEffect, useState } from "react";

import { StudySummary, SummaryStat } from "../../components/StudySummary";

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
    <StudySummary
      icon={ListCheck}
      medallionClass="bg-orange-600"
      title="Simulado concluído!"
      description={
        <>
          Você acertou <span className="tabular-nums">{percentage}%</span> das
          questões deste simulado.
        </>
      }
      restartLabel="Refazer simulado"
      onRestart={onRestart}
      onFinish={onFinish}
      metrics={
        <div className="grid grid-cols-3 gap-3 w-full max-w-md">
          <SummaryStat value={correctCount} label="Acertos" />
          <SummaryStat
            value={totalQuestions - correctCount}
            label="Erros"
          />
          <SummaryStat value={`${percentage}%`} label="Aproveitamento" />
        </div>
      }
    >
      <ul className="flex flex-col gap-2 w-full text-left">
        {questions.slice(0, revealedCount).map((question, index) => {
          const selectedOption = answers.get(question.id) ?? null;
          const isCorrect = correctByQuestionId.get(question.id) ?? false;

          return (
            <li
              key={question.id}
              className="celebrate bg-surface rounded-2xl shadow-surface p-4 flex gap-3"
            >
              <span
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
              <div className="flex-1">
                <p className="font-medium">
                  <span className="tabular-nums">
                    {String(index + 1).padStart(2, "0")}.
                  </span>{" "}
                  <MathText>{question.question}</MathText>
                </p>
                <p className="text-sm text-muted">
                  Sua resposta:{" "}
                  {selectedOption === null ? "não respondida" : selectedOption}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </StudySummary>
  );
}
