import { createFileRoute } from "@tanstack/react-router";
import iconeAscensao from "@/assets/icone-ascensao.svg";
import { NavMenu } from "@/components/NavMenu";
import { AscentionCalendar } from "./-components/AscentionCalendar";

export const Route = createFileRoute("/ascensao/")({
  component: Ascensao,
});

function Ascensao() {
  return (
    <main className="p-6 gap-8 flex flex-col">
      <NavMenu title="Ascensão" />
      <div className="grid grid-cols-2 bg-accent-soft p-4 rounded-3xl">
        <h2 className="grid">
          <span className="text-7xl font-extrabold text-transparent bg-clip-text bg-white [-webkit-text-stroke:3px_var(--accent)]">
            13
          </span>
          <span className="text-3xl text-accent font-semibold">
            Dias em ascensão
          </span>
        </h2>
        <div className="flex items-center justify-end">
          <img src={iconeAscensao} alt="Ícone de ascensão" />
        </div>
      </div>
      <p className="text-center text-balance">
        Esse é o seu recorde de estudos diários seguidos! Não deixe a chama azul
        se apagar.
      </p>
      <AscentionCalendar />
    </main>
  );
}
