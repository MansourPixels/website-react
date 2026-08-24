import type { PlanStep } from "@/mocks/studyPlans";
import { planStepKinds } from "@/utils/planSteps";
import { formatDuration } from "@/utils/time";
import { buttonVariants, cn } from "@heroui/styles";
import { Link } from "@tanstack/react-router";
import { Check, ChevronRight, RotateCcw } from "lucide-react";

interface PlanStepRowProps {
  planId: string;
  step: PlanStep;
  position: number;
  isDone: boolean;
  isNext: boolean;
}

export function PlanStepRow({
  planId,
  step,
  position,
  isDone,
  isNext,
}: PlanStepRowProps) {
  const { label, icon: Icon, chip, action } = planStepKinds[step.kind];

  const state = isDone ? "concluída" : isNext ? "a próxima" : "ainda por fazer";

  return (
    <li
      className={cn(
        "bg-white rounded-2xl shadow-surface p-4 flex flex-col gap-4 border-2",
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
            {step.title}
            <span className="sr-only">: {state}</span>
          </h3>
          <p className="text-sm text-muted text-pretty">{step.goal}</p>
          <p className="text-xs text-muted flex flex-wrap items-center gap-x-2 mt-1">
            <span className="tabular-nums">
              Etapa {String(position).padStart(2, "0")}
            </span>
            <span aria-hidden>·</span>
            <span>{label}</span>
            <span aria-hidden>·</span>
            <span className="tabular-nums">{formatDuration(step.minutes)}</span>
          </p>
        </div>
      </div>

      <Link
        to="/trilha/plano/$planoId/etapa/$etapaId"
        params={{ planoId: planId, etapaId: step.id }}
        className={buttonVariants({
          variant: isNext ? "primary" : "tertiary",
          fullWidth: true,
        })}
      >
        {isDone ? <RotateCcw /> : <ChevronRight />}
        {isDone ? "Refazer etapa" : action}
      </Link>
    </li>
  );
}
