import { useStudyPlans } from "@/contexts/StudyPlanContext";
import type { StudyPlan } from "@/mocks/studyPlans";
import { planStepKinds } from "@/utils/planSteps";
import { Button, Meter } from "@heroui/react";
import { buttonVariants, cn } from "@heroui/styles";
import { Link, useNavigate } from "@tanstack/react-router";
import { CircleStar, Flame, ListChecks, Target } from "lucide-react";

interface StudyPlanCardProps {
  plan: StudyPlan;
}

export function StudyPlanCard({ plan }: StudyPlanCardProps) {
  const { discipline, focus, description, steps } = plan;
  const { getProgress, followPlan, activePlanId } = useStudyPlans();
  const navigate = useNavigate();

  const { completed, total, isComplete, isStarted, nextStep } = getProgress(
    plan.id,
  );
  const isActive = activePlanId === plan.id;

  function startPlan() {
    const firstStep = steps[0];

    if (firstStep === undefined) return;

    followPlan(plan.id);
    navigate({
      to: "/trilha/plano/$planoId/etapa/$etapaId",
      params: { planoId: plan.id, etapaId: firstStep.id },
    });
  }

  return (
    <article
      className={cn(
        "bg-white rounded-3xl shadow-surface p-4 flex flex-col gap-3 border-2",
        isActive && !isComplete ? "border-accent" : "border-transparent",
      )}
    >
      <header className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-semibold text-pretty">{discipline}</h3>
          {isActive && !isComplete ? (
            <span className="text-xs font-medium text-accent bg-accent-soft rounded-full px-2 py-1 shrink-0">
              Seguindo
            </span>
          ) : null}
        </div>
        <p className="flex items-start gap-2 text-sm text-accent">
          <Target className="size-4 shrink-0 mt-0.5" />
          <span className="text-pretty">{focus}</span>
        </p>
      </header>

      {isComplete ? (
        <p className="flex items-start gap-2 text-sm flex-1">
          <Flame className="size-4 shrink-0 mt-0.5 text-accent" />
          <span className="text-pretty">
            Plano concluído. Refazer em alguns dias é o que fixa o conteúdo.
          </span>
        </p>
      ) : (
        <p className="text-sm flex-1 text-pretty">{description}</p>
      )}

      {isStarted ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3 text-sm text-muted">
            <span>{isComplete ? "Concluído" : "Progresso"}</span>
            <span className="tabular-nums font-semibold text-foreground">
              {completed} de {total} etapas
            </span>
          </div>
          <Meter
            value={completed}
            maxValue={total}
            color={isComplete ? "success" : "accent"}
            aria-label={`${discipline}: ${completed} de ${total} etapas concluídas`}
          >
            <Meter.Track>
              <Meter.Fill />
            </Meter.Track>
          </Meter>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        {isComplete || !isStarted ? null : nextStep ? (
          <Link
            to="/trilha/plano/$planoId/etapa/$etapaId"
            params={{ planoId: plan.id, etapaId: nextStep.id }}
            className={buttonVariants({ variant: "primary", fullWidth: true })}
          >
            <CircleStar />
            {planStepKinds[nextStep.kind].action}
          </Link>
        ) : null}

        {!isStarted ? (
          <Button variant="primary" fullWidth onPress={startPlan}>
            <CircleStar />
            Seguir plano de estudos
          </Button>
        ) : null}

        <Link
          to="/trilha/plano/$planoId"
          params={{ planoId: plan.id }}
          className={buttonVariants({
            variant: isComplete || !isStarted ? "tertiary" : "ghost",
            fullWidth: true,
          })}
        >
          <ListChecks />
          Ver as {total} etapas
        </Link>
      </div>
    </article>
  );
}
