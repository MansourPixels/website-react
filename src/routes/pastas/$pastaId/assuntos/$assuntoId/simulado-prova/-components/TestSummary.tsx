import type { PracticeTestQuestion } from "@/mocks/practiceTest";
import { alternativeLetter } from "@/utils/alternatives";
import { Button } from "@heroui/react";
import { Check, RotateCcw, X } from "lucide-react";

interface TestSummaryProps {
  questions: PracticeTestQuestion[];
  answers: number[];
  onRestart: () => void;
  onFinish: () => void;
}

export function TestSummary({
  questions,
  answers,
  onRestart,
  onFinish,
}: TestSummaryProps) {
  const total = questions.length;
  const correctCount = questions.filter(
    (question, index) => question.alternativas[answers[index]]?.correta,
  ).length;
  const percentage = Math.round((correctCount / total) * 100);

  return (
    <>
      <section className="flex flex-col gap-6">
        <div className="bg-white rounded-2xl shadow-surface p-6 flex flex-col items-center gap-2 text-center">
          <h2 className="text-3xl font-semibold">Simulado concluído!</h2>
          <p className="text-5xl font-semibold text-orange-600">
            {correctCount}
            <span className="text-2xl opacity-50">/{total}</span>
          </p>
          <p className="opacity-70">
            Você acertou {percentage}% das questões deste simulado.
          </p>
        </div>

        <ul className="flex flex-col gap-2">
          {questions.map((question, index) => {
            const selected = question.alternativas[answers[index]];
            const isCorrect = Boolean(selected?.correta);
            const correctIndex = question.alternativas.findIndex(
              (alternativa) => alternativa.correta,
            );

            return (
              <li
                key={question.pergunta}
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
                    {String(index + 1).padStart(2, "0")}. {question.pergunta}
                  </p>
                  <p className="text-sm opacity-70">
                    Sua resposta: {alternativeLetter(answers[index])}.{" "}
                    {selected?.texto}
                  </p>
                  {!isCorrect ? (
                    <p className="text-sm text-emerald-700">
                      Resposta correta: {alternativeLetter(correctIndex)}.{" "}
                      {question.alternativas[correctIndex]?.texto}
                    </p>
                  ) : null}
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
