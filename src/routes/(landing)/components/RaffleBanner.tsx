import { Gift } from "lucide-react";
import { Link } from "react-router";

const actionClassName =
  "shrink-0 rounded-full bg-accent-foreground px-3 py-1 text-xs font-semibold text-accent outline-offset-2 outline-accent-foreground focus-visible:outline-2 cursor-pointer hover:bg-accent-foreground/90 active:bg-accent-foreground/80 disabled:cursor-not-allowed disabled:opacity-50";

// Faixa do sorteio no topo da landing. Fica fora do cabeçalho fixo de
// propósito: some na rolagem, sem roubar altura da navegação.
export function RaffleBanner({
  isParticipating,
  onParticipate,
}: {
  /** Quem já tem sessão vai para a tela do sorteio em vez de abrir o cadastro. */
  isParticipating: boolean;
  onParticipate: () => void;
}) {
  return (
    <aside
      aria-label="Sorteio"
      className="bg-accent text-accent-foreground flex items-center justify-center gap-3 px-4 py-2 text-sm"
    >
      <Gift aria-hidden="true" className="size-4 shrink-0" />
      <p className="text-pretty">
        <strong className="font-semibold">Sorteio de uma Alexa!</strong>{" "}
        <span className="hidden sm:inline">
          Crie sua conta no Revi e concorra.
        </span>
      </p>
      {isParticipating ? (
        <Link to="/sorteio" className={actionClassName}>
          Ver participação
        </Link>
      ) : (
        <button
          type="button"
          onClick={onParticipate}
          className={actionClassName}
        >
          Participar
        </button>
      )}
    </aside>
  );
}
