import { difficulties, type Difficulty } from "@/utils/difficulties";
import { Button } from "@heroui/react";
import { CircleCheckBig, RotateCcw } from "lucide-react";

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
    <>
      <section className="flex-1 flex flex-col items-center justify-center gap-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-20 rounded-full bg-emerald-500 text-white flex items-center justify-center">
            <CircleCheckBig className="size-10" />
          </div>
          <h2 className="text-3xl font-semibold">Sessão concluída!</h2>
          <p className="opacity-70 max-w-sm">
            Você revisou todos os {total} flash cards deste assunto. Continue
            praticando para fixar o conteúdo.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full max-w-md">
          {difficulties.map(({ id, label, image }) => (
            <div
              key={id}
              className="bg-white rounded-2xl shadow-surface p-4 flex flex-col items-center gap-2"
            >
              <img src={image} alt="" className="size-10" />
              <strong className="text-2xl font-semibold">{counts[id]}</strong>
              <span className="text-sm opacity-70">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="flex flex-col gap-3 max-w-lg w-full mx-auto">
        <Button fullWidth size="lg" onClick={onRestart}>
          <RotateCcw />
          Refazer sessão
        </Button>
        <Button fullWidth size="lg" variant="tertiary" onClick={onFinish}>
          Voltar ao assunto
        </Button>
      </footer>
    </>
  );
}
