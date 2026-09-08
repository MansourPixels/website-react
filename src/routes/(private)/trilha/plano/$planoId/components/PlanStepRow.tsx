import type { StudyPlanStep } from "@/types/api/studyPlan";
import { studyPlanStepKinds } from "@/utils/studyPlan";
import { buttonVariants, cn } from "@heroui/styles";
import { Check, ChevronRight, RotateCcw } from "lucide-react";
import { Link } from "react-router";

interface PlanStepRowProps {
  planoId: string;
  step: StudyPlanStep;
  position: number;
  isNext: boolean;
}

export function PlanStepRow({ planoId, step, position, isNext }: PlanStepRowProps) {
  const { label, goal, icon: Icon, chip, action } = studyPlanStepKinds[step.stepType];
  const isDone = step.completed;

  const state = isDone ? "concluída" : isNext ? "a próxima" : "ainda por fazer";

  return (
    <li
      className={cn(
        "bg-surface rounded-2xl shadow-surface p-4 flex flex-col gap-4 border-2",
        isNext ? "border-accent" : "border-transparent",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={cn(
            "size-9 shrink-0 rounded-xl flex items-center justify-center text-white",
            isDone ? "bg-success" : chip,
          )}
        >
          {isDone ? <Check className="size-5" /> : <Icon className="size-5" />}
        </span>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-pretty">
            {label} de {step.childFolderName}
            <span className="sr-only">: {state}</span>
          </h3>
          <p className="text-sm text-muted text-pretty">{goal}</p>
          <p className="text-xs text-muted flex flex-wrap items-center gap-x-2 mt-1">
            <span className="tabular-nums">
              Etapa {String(position).padStart(2, "0")}
            </span>
          </p>
        </div>
      </div>

      <Link
        to={`/trilha/plano/${planoId}/etapa/${step.id}`}
        className={buttonVariants({
          variant: isNext ? "primary" : "tertiary",
          fullWidth: true,
        })}
      >
        {isDone ? <RotateCcw /> : <ChevronRight />}
        {isDone ? "Rever etapa" : action}
      </Link>
    </li>
  );
}
