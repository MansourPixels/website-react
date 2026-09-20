import { Button } from "@heroui/react";
import { ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { FlashCard } from "@/components/FlashCard";
import { Math as MathText } from "@/components/Math";
import type { Flashcard } from "@/types/api/flashcard";
import { ArtifactStatus } from "./ArtifactStatus";
import { SeekButton } from "./SeekButton";
import type { ArtifactState } from "./useArtifact";

interface MediaFlashcardsTabProps {
  cards: ArtifactState<Flashcard[]>;
  onSeek: (seconds: number) => void;
}

/** Os flashcards do próprio áudio, com o atalho para o momento a que cada um se refere. */
export function MediaFlashcardsTab({ cards, onSeek }: MediaFlashcardsTabProps) {
  const [index, setIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  if (cards.data === null || cards.phase !== "ready" || cards.error !== null) {
    return <ArtifactStatus name="os flashcards" state={cards} />;
  }

  const total = cards.data.length;
  const card = cards.data[Math.min(index, total - 1)];

  function go(delta: number) {
    setIsRevealed(false);
    setIndex((current) => Math.min(Math.max(current + delta, 0), total - 1));
  }

  return (
    <section aria-label="Flashcards do áudio" className="flex flex-col gap-4">
      <FlashCard
        question={card.front}
        answer={<MathText>{card.back}</MathText>}
        position={card.position}
        total={total}
        isAnswerRevealed={isRevealed}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <SeekButton startSeconds={card.startSeconds} onSeek={onSeek} />
        <Button variant="secondary" onPress={() => setIsRevealed((value) => !value)}>
          {isRevealed ? <EyeOff /> : <Eye />}
          {isRevealed ? "Ocultar resposta" : "Mostrar resposta"}
        </Button>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" fullWidth isDisabled={index === 0} onPress={() => go(-1)}>
          <ChevronLeft />
          Anterior
        </Button>
        <Button fullWidth isDisabled={index >= total - 1} onPress={() => go(1)}>
          Próximo
          <ChevronRight />
        </Button>
      </div>
    </section>
  );
}
