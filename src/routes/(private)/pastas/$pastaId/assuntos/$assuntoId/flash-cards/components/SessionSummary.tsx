import { difficulties, type Difficulty } from "@/utils/difficulties";
import { CircleCheckBig } from "lucide-react";

import {
  StudySummary,
  SummaryStat,
} from "../../components/StudySummary";

interface SessionSummaryProps {
  total: number;
  counts: Record<Difficulty, number>;
  onRestart: () => void;
  onFinish: () => void;
}

export function SessionSummary({
  total,
  counts,
  onRestart,
  onFinish,
}: SessionSummaryProps) {
  return (
    <StudySummary
      icon={CircleCheckBig}
      medallionClass="bg-emerald-500"
      title="Sessão concluída!"
      description={`Você revisou todos os ${total} flash cards deste assunto. Continue praticando para fixar o conteúdo.`}
      restartLabel="Refazer sessão"
      onRestart={onRestart}
      onFinish={onFinish}
      metrics={
        <div className="grid grid-cols-3 gap-3 w-full max-w-md">
          {difficulties.map(({ id, label, image }) => (
            <SummaryStat
              key={id}
              media={<img src={image} alt="" className="size-10" />}
              value={counts[id]}
              label={label}
            />
          ))}
        </div>
      }
    />
  );
}
