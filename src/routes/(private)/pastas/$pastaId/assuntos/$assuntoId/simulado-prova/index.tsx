import { Button, ProgressBar, Spinner } from "@heroui/react";
import { ChevronRight, ListCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";

import { ApiError } from "@/api/client";
import { gradeQuiz, listQuiz } from "@/api/quiz";
import { AlternativeOption } from "@/components/AlternativeOption";
import { Math } from "@/components/Math";
import { NavMenu } from "@/components/NavMenu";
import { SpeakButton } from "@/components/SpeakButton";
import { useFeedback } from "@/hooks/useFeedback";
import { useSpeech } from "@/hooks/useSpeech";
import type {
  GradeRequestItem,
  GradeResponse,
  QuizOption,
  QuizQuestion,
} from "@/types/api/quiz";
import { quizSpeech } from "@/utils/speechText";
import { TestSummary } from "./components/TestSummary";

// Enquanto a lista vier vazia (quiz ainda não gerado), reconsulta a cada
// ~3s; desiste depois de ~30s e mostra o estado "ainda gerando" com opção
// de tentar de novo manualmente.
const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 30_000;

const OPTION_LETTERS: QuizOption[] = ["A", "B", "C", "D"];

function optionText(question: QuizQuestion, option: QuizOption) {
  return {
    A: question.optionA,
    B: question.optionB,
    C: question.optionC,
    D: question.optionD,
  }[option];
}

/** Enunciado e as quatro alternativas — nunca qual é a correta. */
function questionSpeech(question: QuizQuestion) {
  return quizSpeech({
    question: question.question,
    options: OPTION_LETTERS.map((letter) => ({
      letter,
      text: optionText(question, letter),
    })),
  });
}

export default function PracticeTestPage() {
  const { pastaId, assuntoId } = useParams<"pastaId" | "assuntoId">() as {
    pastaId: string;
    assuntoId: string;
  };
  const navigate = useNavigate();
  const feedback = useFeedback();

  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<QuizOption | null>(
    null,
  );
  const [answers, setAnswers] = useState<Map<string, QuizOption>>(new Map());
  const [result, setResult] = useState<GradeResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  const loadQuiz = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const startedAt = Date.now();

    setQuestions(null);
    setLoadError(null);
    setIsGenerating(false);

    async function poll() {
      try {
        const result = await listQuiz(assuntoId);

        if (requestIdRef.current !== requestId) return;

        setQuestions(result);

        const timedOut = Date.now() - startedAt > POLL_TIMEOUT_MS;

        if (result.length === 0 && !timedOut) {
          setIsGenerating(true);
          setTimeout(poll, POLL_INTERVAL_MS);
        } else {
          setIsGenerating(false);
        }
      } catch (error) {
        if (requestIdRef.current !== requestId) return;

        setLoadError(
          error instanceof ApiError
            ? error.detail
            : "Não foi possível carregar o simulado. Tente novamente.",
        );
      }
    }

    poll();
  }, [assuntoId]);

  useEffect(() => {
    loadQuiz();

    return () => {
      requestIdRef.current += 1;
    };
  }, [loadQuiz]);

  const total = questions?.length ?? 0;
  const currentQuestion = questions?.[currentIndex] ?? null;
  const isLastQuestion = currentIndex === total - 1;
  const answeredCount = result !== null ? total : currentIndex;

  const { autoPlay, speak, stop } = useSpeech();

  // A frase entra na dependência como string, não como objeto: a lista é
  // reescrita a cada poll, e depender de `currentQuestion` reiniciaria a
  // leitura a cada 3 segundos. Mesma pergunta produz o mesmo texto.
  const questionText =
    currentQuestion === null ? null : questionSpeech(currentQuestion);

  useEffect(() => {
    if (!autoPlay || questionText === null || result !== null) return;

    speak(questionText);

    return stop;
  }, [autoPlay, questionText, result, speak, stop]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedOption === null || currentQuestion === null || questions === null) {
      return;
    }

    const nextAnswers = new Map(answers);
    nextAnswers.set(currentQuestion.id, selectedOption);
    setAnswers(nextAnswers);
    setSelectedOption(null);

    if (!isLastQuestion) {
      setCurrentIndex((previous) => previous + 1);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload: GradeRequestItem[] = questions.map((question) => ({
        questionId: question.id,
        selectedOption: nextAnswers.get(question.id) as QuizOption,
      }));

      const gradeResult = await gradeQuiz(assuntoId, payload);

      feedback("simulado-concluido");
      setResult(gradeResult);
    } catch (error) {
      feedback("erro");
      setSubmitError(
        error instanceof ApiError
          ? error.detail
          : "Não foi possível enviar o simulado. Tente novamente.",
      );
      // Volta para a última pergunta para o usuário poder tentar de novo.
      setCurrentIndex(total - 1);
    } finally {
      setIsSubmitting(false);
    }
  }

  function restartTest() {
    setCurrentIndex(0);
    setSelectedOption(null);
    setAnswers(new Map());
    setResult(null);
    setSubmitError(null);
  }

  return (
    <main className="content-bg-orange-200 flex-1 flex flex-col">
      <div className="p-6 md:p-8 gap-8 flex flex-col flex-1 justify-between w-full max-w-2xl mx-auto">
        <div>
          <NavMenu
            title="Simulado de prova"
            hasBackButton
            className="mb-3"
            action={
              currentQuestion !== null && result === null ? (
                <SpeakButton
                  label="a pergunta e as alternativas"
                  text={() => questionSpeech(currentQuestion)}
                />
              ) : null
            }
          />
          {questions !== null && questions.length > 0 ? (
            <ProgressBar
              aria-label="Progresso"
              size="lg"
              value={(answeredCount / total) * 100}
            >
              <ProgressBar.Track>
                <ProgressBar.Fill className="bg-orange-600" />
              </ProgressBar.Track>
            </ProgressBar>
          ) : null}
        </div>

        {loadError !== null ? (
          <p className="text-danger text-center py-8">{loadError}</p>
        ) : questions === null ? (
          <div className="flex flex-1 items-center justify-center p-6" aria-busy="true">
            <Spinner size="lg" />
            <span className="sr-only">Carregando simulado</span>
          </div>
        ) : questions.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <p className="text-muted">
              {isGenerating
                ? "O simulado ainda está sendo gerado a partir do conteúdo desta pasta. Isso costuma levar poucos segundos."
                : "Ainda não há simulado para este assunto. Envie conteúdo primeiro para que o Revi IA possa gerar as perguntas."}
            </p>
            {isGenerating ? <Spinner size="lg" /> : null}
            <Button variant="secondary" onPress={loadQuiz}>
              Tentar novamente
            </Button>
          </div>
        ) : result !== null ? (
          <TestSummary
            questions={questions}
            answers={answers}
            result={result}
            onRestart={restartTest}
            onFinish={() =>
              navigate(`/pastas/${pastaId}/assuntos/${assuntoId}`)
            }
          />
        ) : currentQuestion !== null ? (
          <form
            id="simulado"
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 flex-1 justify-between"
          >
            <fieldset className="flex flex-col gap-4">
              <legend className="sr-only">{currentQuestion.question}</legend>
              <div>
                <span className="opacity-70">
                  Pergunta {String(currentIndex + 1).padStart(2, "0")} de{" "}
                  {String(total).padStart(2, "0")}
                </span>
                <h2 className="text-2xl font-semibold" aria-hidden>
                  <Math>{currentQuestion.question}</Math>
                </h2>
              </div>

              <ul className="flex flex-col gap-3">
                {OPTION_LETTERS.map((option) => (
                  <li key={option}>
                    <AlternativeOption
                      letter={option}
                      isSelected={selectedOption === option}
                      onSelect={() => setSelectedOption(option)}
                    >
                      <Math>{optionText(currentQuestion, option)}</Math>
                    </AlternativeOption>
                  </li>
                ))}
              </ul>

              {submitError !== null ? (
                <p role="alert" className="text-danger text-sm text-pretty">
                  {submitError}
                </p>
              ) : null}
            </fieldset>

            <Button
              type="submit"
              fullWidth
              size="lg"
              isDisabled={selectedOption === null || isSubmitting}
            >
              {isLastQuestion ? <ListCheck /> : <ChevronRight />}
              {isSubmitting
                ? "Enviando..."
                : isLastQuestion
                  ? "Finalizar simulado"
                  : "Próxima pergunta"}
            </Button>
          </form>
        ) : null}
      </div>
    </main>
  );
}
