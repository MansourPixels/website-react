import { NavMenu } from "@/components/NavMenu";
import { useStudyPlans } from "@/contexts/StudyPlanContext";
import { findStudyPlan } from "@/mocks/studyPlans";
import { planStepKinds } from "@/utils/planSteps";
import { buttonVariants, cn } from "@heroui/styles";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";

import { FlashCardsStepRunner } from "./-components/FlashCardsStepRunner";
import { PlanSpine } from "./-components/PlanSpine";
import { PracticeStepRunner } from "./-components/PracticeStepRunner";
import { SummaryStepRunner } from "./-components/SummaryStepRunner";

export const Route = createFileRoute(
  "/trilha/plano/$planoId/etapa/$etapaId",
)({
  component: PlanStepPage,
});

function PlanStepPage() {
  const { planoId, etapaId } = Route.useParams();
  const { getProgress, completeStep, resumePlan } = useStudyPlans();

  const plan = findStudyPlan(planoId);
  const stepIndex = plan?.steps.findIndex((item) => item.id === etapaId) ?? -1;
  const step = stepIndex >= 0 ? plan?.steps[stepIndex] : undefined;

  useEffect(() => {
    if (plan !== undefined && step !== undefined) resumePlan(plan.id);
  }, [plan, step, resumePlan]);

  if (plan === undefined || step === undefined) {
    return (
      <main className="p-6 md:p-8 gap-6 flex flex-col w-full max-w-2xl mx-auto">
        <NavMenu title="Etapa não encontrada" hasBackButton />
        <section className="bg-white rounded-3xl shadow-surface p-6 flex flex-col items-center gap-3 text-center">
          <h2 className="text-xl font-semibold">Esta etapa não existe</h2>
          <p className="text-muted text-balance">
            O plano pode ter mudado desde que você abriu este endereço. Volte
            para a Trilha e retome pelo plano sugerido.
          </p>
          <Link to="/trilha" className={buttonVariants({ variant: "primary" })}>
            Voltar à Trilha
          </Link>
        </section>
      </main>
    );
  }

  const { label, tint } = planStepKinds[step.kind];
  const progress = getProgress(plan.id);

  const runnerProps = {
    planId: plan.id,
    planFocus: plan.focus,
    nextStep: progress.nextStep,
    isPlanComplete: progress.isComplete,
    onComplete: () => completeStep(plan.id, step.id),
  };

  return (
    <main className={cn(tint, "flex-1 flex flex-col")}>
      <div className="p-6 md:p-8 gap-4 flex flex-col flex-1 w-full max-w-2xl mx-auto">
        <div className="flex flex-col gap-3">
          <NavMenu title={label} hasBackButton className="text-center pr-12" />
          <PlanSpine
            position={stepIndex + 1}
            total={plan.steps.length}
            focus={plan.focus}
            completedCount={progress.completed}
          />
        </div>

        {step.kind === "resumo" ? (
          <SummaryStepRunner {...runnerProps} step={step} />
        ) : step.kind === "flash-cards" ? (
          <FlashCardsStepRunner {...runnerProps} step={step} />
        ) : (
          <PracticeStepRunner {...runnerProps} step={step} />
        )}
      </div>
    </main>
  );
}
