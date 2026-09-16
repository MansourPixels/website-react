import type { StudyPlanStep } from "@/types/api/studyPlan";
import { studyPlanStepKinds } from "@/utils/studyPlan";
import { Button } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { Check, ChevronRight, Flame, ListChecks, RotateCcw } from "lucide-react";
import { Link } from "react-router";
import { useEffect, useRef } from "react";

interface StepCompleteProps {
  planoId: string;
  disciplineName: string;
  stepTitle: string;
  isPlanComplete: boolean;
  nextStep: StudyPlanStep | null;
  onRestart: () => void;
  restartLabel: string;
}

export function StepComplete({
  planoId,
  disciplineName,
  stepTitle,
  isPlanComplete,
  nextStep,
  onRestart,
  restartLabel,
}: StepCompleteProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // A celebração troca o conteúdo inteiro e desmonta o botão que tinha o
  // foco; sem trazer o foco para o título, ele volta para o `<body>` e quem
  // navega por teclado ou leitor de tela perde o lugar.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <>
      <section className="flex-1 flex flex-col justify-center gap-6 celebrate-stagger">
        <div className="flex flex-col items-center gap-3 text-center">
          <span
            aria-hidden
            className="celebrate size-20 rounded-xl bg-accent text-accent-foreground flex items-center justify-center"
          >
            {isPlanComplete ? (
              <Flame className="size-10" />
            ) : (
              <Check className="size-10" />
            )}
          </span>

          <div role="status" className="flex flex-col gap-1">
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="text-3xl font-semibold text-balance outline-none"
            >
              {isPlanComplete ? "Plano concluído" : "Etapa concluída"}
            </h2>
            <p className="opacity-70 max-w-sm text-balance mx-auto">
              {isPlanComplete
                ? `Você fechou todas as etapas de ${disciplineName}. Refazer o plano em alguns dias é o que fixa o conteúdo.`
                : stepTitle}
            </p>
          </div>
        </div>
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
              to={`/trilha/plano/${planoId}`}
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
              to={`/trilha/plano/${planoId}/etapa/${nextStep.id}`}
              className={buttonVariants({
                variant: "primary",
                fullWidth: true,
                size: "lg",
              })}
            >
              <ChevronRight />
              {studyPlanStepKinds[nextStep.stepType].action}
            </Link>
            <Link
              to={`/trilha/plano/${planoId}`}
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
            to={`/trilha/plano/${planoId}`}
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
