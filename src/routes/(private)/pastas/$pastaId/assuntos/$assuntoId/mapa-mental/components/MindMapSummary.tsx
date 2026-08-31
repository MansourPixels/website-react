import { Button } from "@heroui/react";
import { Network, RotateCcw } from "lucide-react";

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
    <>
      <section className="flex-1 flex flex-col items-center justify-center gap-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-20 rounded-full bg-cyan-600 text-white flex items-center justify-center">
            <Network className="size-10" />
          </div>
          <h2 className="text-3xl font-semibold">
            {isComplete ? "Mapa percorrido!" : "Mapa fechado"}
          </h2>
          <p className="opacity-70 max-w-sm">
            {isComplete
              ? `Você abriu os ${total} conceitos deste mapa. Refaça o percurso de memória para descobrir quais ramos ainda escapam.`
              : `Você abriu ${revealedCount} dos ${total} conceitos deste mapa. Os ramos fechados continuam esperando.`}
          </p>
        </div>
      </section>

      <footer className="flex flex-col gap-3 max-w-lg w-full mx-auto">
        <Button fullWidth size="lg" onClick={onRestart}>
          <RotateCcw />
          Refazer o mapa
        </Button>
        <Button fullWidth size="lg" variant="tertiary" onClick={onFinish}>
          Voltar ao assunto
        </Button>
      </footer>
    </>
  );
}
