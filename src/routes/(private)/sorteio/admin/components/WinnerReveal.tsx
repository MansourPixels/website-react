import { Button } from "@heroui/react";
import { Trophy } from "lucide-react";
import { useEffect } from "react";

import { Confetti } from "@/components/Confetti";
import type { RaffleEntry } from "@/types/api/raffle";

interface WinnerRevealProps {
  winner: RaffleEntry;
  prize: string;
  onClose: () => void;
  onDrawAgain: () => void;
  canDrawAgain: boolean;
}

// Tela cheia com o nome em destaque. O e-mail fica de fora de propósito: a
// tela é transmitida para o salão, e o @ basta para o sorteado se reconhecer.
export function WinnerReveal({
  winner,
  prize,
  onClose,
  onDrawAgain,
  canDrawAgain,
}: WinnerRevealProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sorteado-nome"
      className="fixed inset-0 z-90 flex flex-col items-center justify-center gap-[6vh] bg-background p-8 text-center"
    >
      <Confetti className="z-100" />

      <div className="celebrate-stagger flex max-w-full flex-col items-center gap-[2vh]">
        <Trophy
          aria-hidden="true"
          className="size-[clamp(4rem,12vh,9rem)] text-accent"
        />
        <p className="text-muted text-[clamp(1.25rem,2.6vw,3rem)] font-medium tracking-widest uppercase">
          Ganhou {prize}!
        </p>
        <div className="flex max-w-full flex-col items-center gap-[1.5vh]">
          <h2
            id="sorteado-nome"
            className="max-w-full text-[clamp(3rem,10vw,11rem)] leading-none font-bold break-words"
          >
            {winner.displayName}
          </h2>
          {winner.instagram !== null && (
            <p className="text-accent text-[clamp(1.5rem,4vw,4.5rem)] font-semibold break-all">
              @{winner.instagram}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {/* Foco no "voltar", e não em "sortear novamente": um Espaço a mais
            no teclado não pode disparar um segundo sorteio sem querer. */}
        <Button size="lg" variant="secondary" autoFocus onPress={onClose}>
          Voltar à lista
        </Button>
        <Button size="lg" isDisabled={!canDrawAgain} onPress={onDrawAgain}>
          Sortear novamente
        </Button>
      </div>
    </div>
  );
}
