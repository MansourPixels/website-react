import { Spinner } from "@heroui/react";
import { buttonVariants, cn } from "@heroui/styles";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { ApiError } from "@/api/client";
import { completeStep, getStudyPlan } from "@/api/studyPlan";
import { ErrorState } from "@/components/ErrorState";
import { NavMenu } from "@/components/NavMenu";
import { useCanGoBack } from "@/hooks/useCanGoBack";
import type { StudyPlan } from "@/types/api/studyPlan";
import { pageMeta } from "@/utils/pageMeta";
import {
  groupProgress,
  groupStepsByDiscipline,
  studyPlanStepKinds,
} from "@/utils/studyPlan";

import { PlanSpine } from "./components/PlanSpine";
import { StepRunner } from "./components/StepRunner";

export function meta() {
  return pageMeta({
    title: "Etapa do plano",
    description: "O que estudar nesta etapa da trilha e por onde começar.",
  });
}

export default function PlanStepPage() {
  const { planoId, etapaId } = useParams<"planoId" | "etapaId">() as {
    planoId: string;
    etapaId: string;
  };

  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const canGoBack = useCanGoBack();

  useEffect(() => {
    let cancelled = false;

    setPlan(null);
    setLoadError(null);

    getStudyPlan()
      .then((result) => {
        if (!cancelled) setPlan(result);
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        setLoadError(
          error instanceof ApiError
            ? error.detail
            : "Não foi possível carregar a trilha. Tente novamente.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  if (loadError !== null) {
    return (
      <main className="p-6 md:p-8 gap-6 flex flex-col w-full max-w-2xl mx-auto">
        <NavMenu title="Trilha" hasBackButton />
        <ErrorState onRetry={() => setReloadKey((key) => key + 1)}>
          {loadError}
        </ErrorState>
      </main>
    );
  }

  if (plan === null) {
    return (
      <main className="p-6 md:p-8 gap-6 flex flex-col w-full max-w-2xl mx-auto flex-1 items-center justify-center">
        <Spinner size="lg" />
        <span className="sr-only">Carregando etapa</span>
      </main>
    );
  }

  const group = groupStepsByDiscipline(plan.steps).find(
    (item) => item.motherFolderId === planoId,
  );
  const stepIndex = group?.steps.findIndex((item) => item.id === etapaId) ?? -1;
  const step = stepIndex >= 0 ? group?.steps[stepIndex] : undefined;

  if (group === undefined || step === undefined) {
    return (
      <main className="p-6 md:p-8 gap-6 flex flex-col w-full max-w-2xl mx-auto">
        <NavMenu title="Etapa não encontrada" hasBackButton />
        <section className="bg-surface rounded-3xl shadow-surface p-6 flex flex-col items-center gap-3 text-center">
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

  const { label, tint } = studyPlanStepKinds[step.stepType];
  const progress = groupProgress(group.steps);
  const planSteps = group.steps;

  async function handleComplete() {
    await completeStep(etapaId);

    setPlan((current) => {
      if (current === null) return current;

      return {
        ...current,
        steps: current.steps.map((item) =>
          item.id === etapaId
            ? { ...item, completed: true, completedAt: new Date().toISOString() }
            : item,
        ),
      };
    });

    // Quem fecha a etapa precisa saber, no mesmo tique, se o plano acabou —
    // a prop `isPlanComplete` só se atualiza no render seguinte.
    return planSteps.every((item) => item.id === etapaId || item.completed);
  }

  return (
    <main className={cn(tint, "flex-1 flex flex-col")}>
      <div className="p-6 md:p-8 gap-4 flex flex-col flex-1 w-full max-w-2xl mx-auto">
        <div className="flex flex-col gap-3">
          {/* O `pr-12` compensa a largura do botão de voltar para o título
              ficar centrado; sem botão, ele desloca o título. */}
          <NavMenu
            title={label}
            hasBackButton
            className={cn("text-center", canGoBack && "pr-12")}
          />
          <PlanSpine
            position={stepIndex + 1}
            disciplineName={group.motherFolderName}
            steps={group.steps}
          />
        </div>

        {/* Trocar de etapa é a mesma rota: sem a chave, o estado interno
            (inclusive o "pronto para confirmar") vazaria de uma para a
            outra. */}
        <StepRunner
          key={step.id}
          planoId={planoId}
          disciplineName={group.motherFolderName}
          step={step}
          nextStep={progress.nextStep}
          isPlanComplete={progress.isComplete}
          onComplete={handleComplete}
        />
      </div>
    </main>
  );
}
