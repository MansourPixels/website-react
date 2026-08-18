import { Button } from "@heroui/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Ellipsis } from "lucide-react";
import { FABButton } from "../components/FABButton";
import { NavMenu } from "../components/NavMenu";

export const Route = createFileRoute("/pastas")({
  component: Pastas,
});

const pastas = [
  {
    name: "Português",
    color: "#F53153",
    amount: 2,
  },
  {
    name: "Matemática",
    color: "#388cf9",
    amount: 8,
  },
  {
    name: "Geografia",
    color: "#f98838",
    amount: 3,
  },
  {
    name: "Sociologia",
    color: "#44af69",
    amount: 3,
  },
  {
    name: "História",
    color: "#2b193d",
    amount: 3,
  },
];

function Pastas() {
  return (
    <main className="p-6 gap-8 flex flex-col">
      <NavMenu title="Pastas" />
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {pastas.map(({ color, name, amount }) => (
          <article className="relative hover:brightness-105">
            <Link
              to="/"
              className="block active:scale-98 transition-all bg-(--cor-pasta) relative w-full rounded-3xl after:content-[''] after:bg-[url('/detalhe-pasta.svg')] after:bg-no-repeat after:bg-top-right after:w-full after:h-full after:inset-0 after:flex after:absolute"
              style={{ "--cor-pasta": color }}
            >
              <div className="relative flex overflow-hidden h-20">
                {Array.from({ length: Math.min(amount, 4) }).map(() => (
                  <div className="preview">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                ))}
              </div>
              <div className="relative flex flex-col justify-center h-20 bg-black/15 px-4 py-1 rounded-b-3xl text-white">
                <h2 className="text-2xl font-semibold">{name}</h2>
                <span className="opacity-75">{amount}</span>
              </div>
            </Link>
            <Button
              variant="ghost"
              isIconOnly
              className="absolute bottom-9 right-2 size-10 text-white hover:bg-white/10 active:bg-white/15"
            >
              <Ellipsis />
            </Button>
          </article>
        ))}
      </div>

      <FABButton />
    </main>
  );
}
