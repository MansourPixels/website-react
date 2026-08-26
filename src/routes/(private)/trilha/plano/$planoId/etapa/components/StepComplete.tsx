import type { PlanStep } from "@/mocks/studyPlans";
import { planStepKinds } from "@/utils/planSteps";
import { Button } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { Check, ChevronRight, Flame, ListChecks, RotateCcw } from "lucide-react";
import { Link } from "react-router";
import type { ReactNode } from "react";

interface StepCompleteProps {
  planId: string;
  planFocus: string;
  stepTitle: string;
  isPlanComplete: boolean;
  nextStep: PlanStep | null;
  onRestart: () => void;
  restartLabel: string;
  children?: ReactNode;
}

export function StepComplete({
  planId,
  planFocus,
  stepTitle,
  isPlanComplete,
  nextStep,
  onRestart,
  restartLabel,
  children,
}: StepCompleteProps) {
  return (
    <>
      <section className="flex-1 flex flex-col justify-center gap-6 celebrate-stagger">
        <div className="flex flex-col items-center gap-3 text-center">
          <span
            aria-hidden
            className="celebrate size-20 rounded-full bg-accent text-accent-foreground flex items-center justify-center"
          >
            {isPlanComplete ? (
              <Flame className="size-10" />
            ) : (
              <Check className="size-10" />
            )}
          </span>

          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-semibold text-balance">
              {isPlanComplete ? "Plano concluído" : "Etapa concluída"}
            </h2>
            <p className="opacity-70 max-w-sm text-balance mx-auto">
              {isPlanComplete
                ? `Você fechou todas as etapas de ${planFocus.toLowerCase()}. Refazer o plano em alguns dias é o que fixa o conteúdo.`
                : stepTitle}
            </p>
          </div>
        </div>

        {children}
      </section>

      <footer
        className="flex flex-col gap-3 celebrate-stagger"
        data-celebrate-after
      >
        {isPlanComplete ? (
          <>
            <Link
              to="/trilha"
              className={buttonVariants({
                variant: "primary",
                fullWidth: true,
                size: "lg",
              })}
            >
              Voltar à Trilha
            </Link>
            <Link
              to={`/trilha/plano/${planId}`}
              className={buttonVariants({
                variant: "tertiary",
                fullWidth: true,
                size: "lg",
              })}
            >
              <ListChecks />
              Ver o plano
            </Link>
          </>
        ) : nextStep ? (
          <>
            <Link
              to={`/trilha/plano/${planId}/etapa/${nextStep.id}`}
              className={buttonVariants({
                variant: "primary",
                fullWidth: true,
                size: "lg",
              })}
            >
              <ChevronRight />
              {planStepKinds[nextStep.kind].action}
            </Link>
            <Link
              to={`/trilha/plano/${planId}`}
              className={buttonVariants({
                variant: "tertiary",
                fullWidth: true,
                size: "lg",
              })}
            >
              <ListChecks />
              Ver o plano
            </Link>
          </>
        ) : (
          <Link
            to={`/trilha/plano/${planId}`}
            className={buttonVariants({
              variant: "primary",
              fullWidth: true,
              size: "lg",
            })}
          >
            <ListChecks />
            Ver o plano
          </Link>
        )}

        <Button variant="ghost" fullWidth onPress={onRestart}>
          <RotateCcw />
          {restartLabel}
        </Button>
      </footer>
    </>
  );
}
