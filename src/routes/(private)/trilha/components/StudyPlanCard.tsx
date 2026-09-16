import type { StudyPlanGroup } from "@/utils/studyPlan";
import { groupProgress, studyPlanStepKinds } from "@/utils/studyPlan";
import { Meter } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { Link } from "react-router";
import { CircleStar, Flame, ListChecks, Target } from "lucide-react";

interface StudyPlanCardProps {
  group: StudyPlanGroup;
}

export function StudyPlanCard({ group }: StudyPlanCardProps) {
  const { motherFolderId, motherFolderName, steps } = group;
  const { completed, total, isComplete, isStarted, nextStep } =
    groupProgress(steps);

  return (
    <article className="bg-surface rounded-3xl shadow-surface p-4 flex flex-col gap-3 border-2 border-transparent dark:border-border">
      <header className="flex flex-col gap-1">
        <h3 className="text-xl font-semibold text-pretty">
          {motherFolderName}
        </h3>
        <p className="flex items-start gap-2 text-sm text-muted">
          <Target className="size-4 shrink-0 mt-0.5" />
          <span className="text-pretty">Reforçar esta disciplina</span>
        </p>
      </header>

      {isComplete ? (
        <p className="flex items-start gap-2 text-sm flex-1 text-muted">
          <Flame className="size-4 shrink-0 mt-0.5 text-accent" />
          <span className="text-pretty">
            Plano concluído. Refazer em alguns dias é o que fixa o conteúdo.
          </span>
        </p>
      ) : (
        <p className="text-sm flex-1 text-pretty text-muted">
          Um plano de <span className="tabular-nums">{total}</span> etapas para
          reforçar seu domínio nesta disciplina.
        </p>
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
            color="accent"
            aria-label={`${motherFolderName}: ${completed} de ${total} etapas concluídas`}
          >
            <Meter.Track>
              <Meter.Fill />
            </Meter.Track>
          </Meter>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        {!isComplete && nextStep ? (
          <Link
            to={`/trilha/plano/${motherFolderId}/etapa/${nextStep.id}`}
            className={buttonVariants({ variant: "primary", fullWidth: true })}
          >
            <CircleStar />
            {studyPlanStepKinds[nextStep.stepType].action}
          </Link>
        ) : null}

        <Link
          to={`/trilha/plano/${motherFolderId}`}
          className={buttonVariants({
            variant: isComplete || !isStarted ? "tertiary" : "ghost",
            fullWidth: true,
          })}
        >
          <ListChecks />
          Ver as <span className="tabular-nums">{total}</span> etapas
        </Link>
      </div>
    </article>
  );
}
