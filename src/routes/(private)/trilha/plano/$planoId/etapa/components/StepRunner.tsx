import { ErrorState } from "@/components/ErrorState";
import { useFeedback } from "@/hooks/useFeedback";
import type { StudyPlanStep } from "@/types/api/studyPlan";
import { stepDestinationPath, studyPlanStepKinds } from "@/utils/studyPlan";
import { Button } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { CircleCheckBig } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";

import { StepComplete } from "./StepComplete";

interface StepRunnerProps {
  planoId: string;
  disciplineName: string;
  step: StudyPlanStep;
  nextStep: StudyPlanStep | null;
  isPlanComplete: boolean;
  // Devolve se o plano ficou completo com esta etapa. Ler isso da prop dava o
  // valor do render anterior, e a última etapa tocava o som de "etapa
  // concluída" com a tela dizendo "Plano concluído".
  onComplete: () => Promise<boolean>;
}

// As três etapas (resumo, flash cards, simulado) só existiam como conteúdo
// embutido no mock antigo. A API não devolve mais esse conteúdo aqui — cada
// etapa aponta pra uma childFolderId real — então a etapa vira um convite
// para abrir a tela de verdade (specs 03-05) e, ao voltar, confirmar que
// concluiu.
export function StepRunner({
  planoId,
  disciplineName,
  step,
  nextStep,
  isPlanComplete,
  onComplete,
}: StepRunnerProps) {
  const [searchParams] = useSearchParams();

  // `rever` chega da linha do plano: a etapa já está concluída, mas o aluno
  // pediu para revê-la, não para rever a celebração.
  const isReviewing = searchParams.get("rever") === "1";
  // `confirmar` chega de volta do material. Sem ele, voltar pelo botão do
  // navegador devolvia a tela idêntica à de antes, sem sinal de que ainda
  // falta confirmar.
  const isAwaitingConfirmation = searchParams.get("confirmar") === "1";

  const [isFinished, setIsFinished] = useState(
    step.completed && !isReviewing && !isAwaitingConfirmation,
  );
  const [didCompletePlan, setDidCompletePlan] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const feedback = useFeedback();

  const meta = studyPlanStepKinds[step.stepType];
  const Icon = meta.icon;

  // O material fica fora da Trilha; o parâmetro leva o caminho de volta para
  // esta etapa já no estado de confirmar.
  const returnPath = `/trilha/plano/${planoId}/etapa/${step.id}?confirmar=1`;
  const materialPath = `${stepDestinationPath(step)}?retorno=${encodeURIComponent(returnPath)}`;

  async function finish() {
    if (step.completed) {
      setIsFinished(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const planCompleted = await onComplete();

      feedback(
        planCompleted ? "trilha-plano-concluido" : "trilha-etapa-concluida",
      );
      setDidCompletePlan(planCompleted);
      setIsFinished(true);
    } catch {
      feedback("erro");
      setError(
        "Não foi possível marcar esta etapa como concluída. Tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isFinished) {
    return (
      <StepComplete
        planoId={planoId}
        disciplineName={disciplineName}
        stepTitle={`Etapa de ${meta.label.toLowerCase()} de ${step.childFolderName} concluída.`}
        isPlanComplete={didCompletePlan ?? isPlanComplete}
        nextStep={nextStep}
        onRestart={() => setIsFinished(false)}
        restartLabel="Ver esta etapa de novo"
      />
    );
  }

  return (
    <>
      <section className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
        <span
          aria-hidden
          className={`size-16 rounded-xl flex items-center justify-center text-white ${meta.chip}`}
        >
          <Icon className="size-8" />
        </span>

        <header className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold text-balance">
            {meta.label} de {step.childFolderName}
          </h2>
          <p className="opacity-70 text-pretty">{meta.goal}</p>
        </header>

        {isAwaitingConfirmation && !step.completed ? (
          <p role="status" className="text-sm opacity-70 text-pretty max-w-sm">
            Você abriu o material desta etapa. Se terminou, marque a etapa como
            concluída aqui embaixo.
          </p>
        ) : null}

        <Link
          to={materialPath}
          className={buttonVariants({
            // Estudar é a ação que faz a etapa andar; confirmar só registra o
            // que já aconteceu. Depois de voltar do material, a ordem inverte.
            variant: isAwaitingConfirmation ? "secondary" : "primary",
            size: "lg",
          })}
        >
          {meta.action}
        </Link>
      </section>

      <footer className="flex flex-col gap-3">
        {error !== null ? <ErrorState isCompact>{error}</ErrorState> : null}
        <Button
          variant={isAwaitingConfirmation ? "primary" : "secondary"}
          fullWidth
          size="lg"
          onPress={finish}
          isDisabled={isSubmitting}
        >
          <CircleCheckBig />
          {isSubmitting ? "Enviando..." : "Concluí esta etapa"}
        </Button>
      </footer>
    </>
  );
}
