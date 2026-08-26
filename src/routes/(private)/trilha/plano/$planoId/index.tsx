import { NavMenu } from "@/components/NavMenu";
import { useStudyPlans } from "@/contexts/StudyPlanContext";
import { findStudyPlan } from "@/mocks/studyPlans";
import { Button, Meter } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { CircleStar, Flame, RotateCcw } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";

import { PlanStepRow } from "./components/PlanStepRow";

export default function StudyPlanPage() {
  const { planoId } = useParams<"planoId">() as { planoId: string };
  const navigate = useNavigate();
  const { getProgress, restartPlan, leavePlan, activePlanId } = useStudyPlans();

  const plan = findStudyPlan(planoId);

  if (plan === undefined) {
    return (
      <main className="p-6 md:p-8 gap-6 flex flex-col w-full max-w-3xl mx-auto">
        <NavMenu title="Plano de estudos" hasBackButton />
        <section className="bg-white rounded-3xl shadow-surface p-6 flex flex-col items-center gap-3 text-center">
          <h2 className="text-xl font-semibold">Plano não encontrado</h2>
          <p className="text-muted text-balance">
            Esse plano não existe mais ou o endereço está incorreto. Volte para
            a Trilha e escolha um plano sugerido pela Revi IA.
          </p>
          <Link to="/trilha" className={buttonVariants({ variant: "primary" })}>
            Voltar à Trilha
          </Link>
        </section>
      </main>
    );
  }

  const progress = getProgress(plan.id);
  const { completedStepIds, completed, total, isComplete, nextStep } = progress;
  const isFollowing = activePlanId === plan.id;

  function stopFollowing() {
    leavePlan();
    navigate("/trilha");
  }

  return (
    <main className="p-6 md:p-8 gap-6 flex flex-col w-full max-w-3xl mx-auto">
      <NavMenu title="Plano de estudos" hasBackButton />

      <section className="bg-accent-soft rounded-3xl p-4 md:p-6 flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <h2 className="text-2xl md:text-3xl font-semibold text-accent text-balance">
            {plan.focus}
          </h2>
          <p className="text-sm text-accent-soft-foreground text-pretty">
            Plano sugerido pela Revi IA em {plan.discipline}.{" "}
            {plan.description}
          </p>
        </header>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3 text-sm text-accent-soft-foreground">
            <span>Progresso do plano</span>
            <span className="tabular-nums font-semibold">
              {completed} de {total} etapas
            </span>
          </div>
          <Meter
            value={completed}
            maxValue={total}
            color={isComplete ? "success" : "accent"}
            aria-label={`Progresso do plano: ${completed} de ${total} etapas`}
          >
            <Meter.Track>
              <Meter.Fill />
            </Meter.Track>
          </Meter>
        </div>
      </section>

      {isComplete ? (
        <section className="bg-white rounded-3xl shadow-surface p-6 flex flex-col items-center gap-3 text-center">
          <span
            aria-hidden
            className="size-16 rounded-full bg-accent text-accent-foreground flex items-center justify-center"
          >
            <Flame className="size-8" />
          </span>
          <h2 className="text-2xl font-semibold">Plano concluído</h2>
          <p className="text-muted text-balance max-w-md">
            Você fechou as {total} etapas de {plan.focus.toLowerCase()}. Refazer
            o plano em alguns dias é o que fixa o conteúdo de verdade.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md pt-1">
            <Button
              variant="tertiary"
              fullWidth
              onPress={() => restartPlan(plan.id)}
            >
              <RotateCcw />
              Refazer o plano
            </Button>
            <Link
              to="/trilha"
              className={buttonVariants({
                variant: "primary",
                fullWidth: true,
              })}
            >
              Voltar à Trilha
            </Link>
          </div>
        </section>
      ) : null}

      <section id="etapas" className="flex flex-col gap-3">
        <h2 className="font-semibold">Etapas</h2>
        <ol className="flex flex-col gap-3">
          {plan.steps.map((step, index) => (
            <PlanStepRow
              key={step.id}
              planId={plan.id}
              step={step}
              position={index + 1}
              isDone={completedStepIds.includes(step.id)}
              isNext={nextStep?.id === step.id}
            />
          ))}
        </ol>
      </section>

      {isFollowing && !isComplete ? (
        <footer className="flex flex-col gap-3">
          <Button variant="ghost" fullWidth onPress={stopFollowing}>
            Deixar de seguir este plano
          </Button>
        </footer>
      ) : null}

      {!isFollowing && !isComplete ? (
        <footer className="flex flex-col gap-3">
          <p className="text-sm text-muted text-center text-balance">
            Você não está seguindo este plano. Começar qualquer etapa retoma o
            acompanhamento na Trilha.
          </p>
          {nextStep ? (
            <Link
              to={`/trilha/plano/${plan.id}/etapa/${nextStep.id}`}
              className={buttonVariants({
                variant: "primary",
                fullWidth: true,
              })}
            >
              <CircleStar />
              Seguir plano de estudos
            </Link>
          ) : null}
        </footer>
      ) : null}
    </main>
  );
}
