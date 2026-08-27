import { Math as MathText } from "@/components/Math";
import type {
  GradeResponse,
  QuizOption,
  QuizQuestion,
} from "@/types/api/quiz";
import { Button } from "@heroui/react";
import { Check, RotateCcw, X } from "lucide-react";

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
          {questions.map((question, index) => {
            const selectedOption = answers.get(question.id) ?? null;
            const isCorrect = correctByQuestionId.get(question.id) ?? false;

            return (
              <li
                key={question.id}
                className="bg-white rounded-2xl shadow-surface p-4 flex gap-3"
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
