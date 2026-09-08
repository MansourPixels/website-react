import type { ReactNode } from "react";

interface FlashCardProps {
  question: string;
  answer: ReactNode;
  position: number;
  total: number;
  isAnswerRevealed: boolean;
}

export function FlashCard({
  question,
  answer,
  position,
  total,
  isAnswerRevealed,
}: FlashCardProps) {
  const counter = `Pergunta ${String(position).padStart(2, "0")} de ${String(
    total,
  ).padStart(2, "0")}`;

  return (
    <div className="flex-1 min-h-[min(24rem,50vh)] relative perspective-distant">
      <div
        className={`absolute inset-0 transform-3d transition-transform duration-500 ease-in-out motion-reduce:transition-none ${
          isAnswerRevealed ? "rotate-y-180" : ""
        }`}
      >
        <div className="absolute inset-0 backface-hidden bg-emerald-500 rounded-2xl shadow-surface text-white text-center px-4 py-8 flex flex-col justify-between">
          <span></span>
          <h2 className="text-2xl font-semibold align-middle">{question}</h2>
          <p className="opacity-90">{counter}</p>
        </div>

        <div className="absolute inset-0 backface-hidden rotate-y-180 border border-emerald-500 rounded-2xl shadow-surface text-center px-4 py-8 flex flex-col justify-between bg-surface">
          <h2>{question}</h2>
          <h3 className="text-2xl font-semibold">{answer}</h3>
          <p className="opacity-90">{counter}</p>
        </div>
      </div>
    </div>
  );
}
