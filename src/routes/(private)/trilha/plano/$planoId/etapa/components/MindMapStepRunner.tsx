import { Button } from "@heroui/react";
import { Waypoints } from "lucide-react";
import { useState } from "react";

import { MindMapCanvas } from "@/components/MindMapCanvas";
import { useMindMap } from "@/hooks/useMindMap";
import type { MindMapPlanStep, PlanStep } from "@/mocks/studyPlans";

import { StepComplete } from "./StepComplete";

interface MindMapStepRunnerProps {
  planId: string;
  planFocus: string;
  step: MindMapPlanStep;
  nextStep: PlanStep | null;
  isPlanComplete: boolean;
  onComplete: () => void;
}

export function MindMapStepRunner({
  planId,
  planFocus,
  step,
  nextStep,
  isPlanComplete,
  onComplete,
}: MindMapStepRunnerProps) {
  const [isFinished, setIsFinished] = useState(false);
  const { placements, revealedCount, total, isComplete, toggle, expandAll, reset } =
    useMindMap(step.map.raiz);

  function finish() {
    onComplete();
    setIsFinished(true);
  }

  function restart() {
    reset();
    setIsFinished(false);
  }

  if (isFinished) {
    return (
      <StepComplete
        planId={planId}
        planFocus={planFocus}
        stepTitle={`Você percorreu o mapa de ${step.title.toLowerCase()}.`}
        isPlanComplete={isPlanComplete}
        nextStep={nextStep}
        onRestart={restart}
        restartLabel="Refazer o mapa"
      >
        <p className="text-center opacity-70">
          {revealedCount} de {total} conceitos abertos.
        </p>
      </StepComplete>
    );
  }

  return (
    <>
      <section className="flex-1 flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold text-balance">{step.title}</h2>
          <p className="opacity-70 text-pretty">{step.goal}</p>
        </header>

        {/* Esta página rola: o canvas não captura pan nem zoom, senão o dedo
            do aluno fica preso nele. A navegação é por toque nos ramos. */}
        <div className="h-[55svh] rounded-2xl overflow-hidden bg-white/40 shadow-surface">
          <MindMapCanvas
            root={step.map.raiz}
            placements={placements}
            onToggle={toggle}
            fitKey={placements.length}
            isInteractive={false}
          />
        </div>
      </section>

      <footer className="flex flex-col gap-3">
        <Button fullWidth size="lg" onPress={finish}>
          <Waypoints />
          Concluí o mapa
        </Button>
        <Button
          fullWidth
          size="lg"
          variant="tertiary"
          onPress={expandAll}
          isDisabled={isComplete}
        >
          Expandir tudo
        </Button>
      </footer>
    </>
  );
}
