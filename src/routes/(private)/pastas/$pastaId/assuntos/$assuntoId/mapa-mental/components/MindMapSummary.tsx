import { Network } from "lucide-react";

import {
  StudySummary,
  SummaryStat,
} from "../../components/StudySummary";

interface MindMapSummaryProps {
  revealedCount: number;
  total: number;
  onRestart: () => void;
  onFinish: () => void;
}

export function MindMapSummary({
  revealedCount,
  total,
  onRestart,
  onFinish,
}: MindMapSummaryProps) {
  const isComplete = revealedCount === total;

  return (
    <StudySummary
      icon={Network}
      medallionClass="bg-cyan-600"
      title={isComplete ? "Mapa percorrido!" : "Mapa fechado"}
      description={
        isComplete
          ? "Você abriu todos os conceitos deste mapa. Refaça o percurso de memória para descobrir quais ramos ainda escapam."
          : "Os ramos que você deixou fechados continuam esperando."
      }
      restartLabel="Refazer o mapa"
      onRestart={onRestart}
      onFinish={onFinish}
      metrics={
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          <SummaryStat value={revealedCount} label="Conceitos abertos" />
          <SummaryStat value={total - revealedCount} label="Ramos fechados" />
        </div>
      }
    />
  );
}
