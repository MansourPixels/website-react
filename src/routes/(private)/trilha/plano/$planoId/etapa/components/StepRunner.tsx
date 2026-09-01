import { useFeedback } from "@/hooks/useFeedback";
import type { StudyPlanStep } from "@/types/api/studyPlan";
import { stepDestinationPath, studyPlanStepKinds } from "@/utils/studyPlan";
import { Button } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { CircleCheckBig } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { StepComplete } from "./StepComplete";

interface StepRunnerProps {
  planoId: string;
  disciplineName: string;
  step: StudyPlanStep;
  nextStep: StudyPlanStep | null;
  isPlanComplete: boolean;
  onComplete: () => Promise<void>;
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
  const [isFinished, setIsFinished] = useState(step.completed);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const feedback = useFeedback();

  const meta = studyPlanStepKinds[step.stepType];
  const Icon = meta.icon;

  async function finish() {
    if (step.completed) {
      setIsFinished(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onComplete();

      feedback(isPlanComplete ? "trilha-plano-concluido" : "trilha-etapa-concluida");
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
        isPlanComplete={isPlanComplete}
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
          className={`size-16 rounded-full flex items-center justify-center text-white ${meta.chip}`}
        >
          <Icon className="size-8" />
        </span>

        <header className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold text-balance">
            {meta.label} de {step.childFolderName}
          </h2>
          <p className="opacity-70 text-pretty">{meta.goal}</p>
        </header>

        <Link
          to={stepDestinationPath(step)}
          className={buttonVariants({ variant: "tertiary", size: "lg" })}
        >
          {meta.action}
        </Link>
      </section>

      <footer className="flex flex-col gap-3">
        {error !== null ? (
          <p
            role="alert"
            className="text-danger text-sm text-center text-pretty"
          >
            {error}
          </p>
        ) : null}
        <Button fullWidth size="lg" onPress={finish} isDisabled={isSubmitting}>
          <CircleCheckBig />
          {isSubmitting ? "Enviando..." : "Concluí esta etapa"}
        </Button>
      </footer>
    </>
  );
}
