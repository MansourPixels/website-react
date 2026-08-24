import type { PlanStep, SummaryPlanStep } from "@/mocks/studyPlans";
import { Button } from "@heroui/react";
import { CircleCheckBig } from "lucide-react";
import { useState } from "react";

import { StepComplete } from "./StepComplete";

interface SummaryStepRunnerProps {
  planId: string;
  planFocus: string;
  step: SummaryPlanStep;
  nextStep: PlanStep | null;
  isPlanComplete: boolean;
  onComplete: () => void;
}

export function SummaryStepRunner({
  planId,
  planFocus,
  step,
  nextStep,
  isPlanComplete,
  onComplete,
}: SummaryStepRunnerProps) {
  const [isFinished, setIsFinished] = useState(false);

  function finish() {
    onComplete();
    setIsFinished(true);
  }

  if (isFinished) {
    return (
      <StepComplete
        planId={planId}
        planFocus={planFocus}
        stepTitle={`Você leu o resumo de ${step.title.toLowerCase()}.`}
        isPlanComplete={isPlanComplete}
        nextStep={nextStep}
        onRestart={() => setIsFinished(false)}
        restartLabel="Reler o resumo"
      />
    );
  }

  return (
    <>
      <section className="flex-1 flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold text-balance">{step.title}</h2>
          <p className="opacity-70 text-pretty">{step.goal}</p>
        </header>

        <article className="bg-white p-4 md:p-8 rounded-2xl shadow-surface prose-sm md:prose-base [&_math]:mx-auto prose-headings:font-semibold grid prose-zinc prose-ul:list-disc prose-ol:list-decimal prose-strong:font-semibold prose-h2:mt-4 prose-h2:mb-2">
          {step.content}
        </article>
      </section>

      <footer className="flex flex-col gap-3">
        <Button fullWidth size="lg" onPress={finish}>
          <CircleCheckBig />
          Concluí a leitura
        </Button>
      </footer>
    </>
  );
}
