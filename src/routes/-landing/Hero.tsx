import { FolderCover } from "@/components/FolderCover";
import { defaultFolders } from "@/mocks/folders";
import { buttonVariants } from "@heroui/styles";
import { Link } from "react-router";

const byName = (name: string) =>
  defaultFolders.find((folder) => folder.name === name);

const leftColumn = [byName("Português"), byName("Sociologia")].filter(
  (folder) => folder !== undefined,
);
const rightColumn = [byName("Geografia"), byName("História")].filter(
  (folder) => folder !== undefined,
);

export function Hero() {
  return (
    <section
      id="topo"
      className="mx-auto w-full max-w-6xl scroll-mt-28 px-6 pt-12 pb-16 md:px-8 lg:pt-24 lg:pb-24"
    >
      <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        <div className="celebrate-stagger flex flex-col gap-6">
          <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight text-balance md:text-5xl">
            Fotografe o caderno. Estude o que está nele.
          </h1>

          <p className="max-w-[46ch] text-lg leading-relaxed text-pretty text-muted">
            O Revi IA reconhece a disciplina, arquiva a foto e vira flash cards,
            resumo e simulado do seu próprio material.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/cadastro"
              className={buttonVariants({ variant: "primary", size: "lg" })}
            >
              Começar a estudar
            </Link>
            <a
              href="#como-funciona"
              className={buttonVariants({ variant: "tertiary", size: "lg" })}
            >
              Ver como funciona
            </a>
          </div>
        </div>

        <div
          role="img"
          aria-label="Pastas de disciplinas do Revi, cada capa mostrando as fotos já arquivadas dentro dela."
          className="celebrate-stagger grid gap-4 sm:grid-cols-2 md:gap-5"
        >
          <div className="flex flex-col gap-4 md:gap-5">
            {leftColumn.map((folder, index) => (
              <FolderCover
                key={folder.id}
                folder={folder}
                titleAs="p"
                className={index > 0 ? "hidden lg:block" : undefined}
              />
            ))}
          </div>

          <div className="hidden flex-col gap-4 sm:flex sm:translate-y-8 md:gap-5 md:translate-y-12">
            {rightColumn.map((folder, index) => (
              <FolderCover
                key={folder.id}
                folder={folder}
                titleAs="p"
                className={index > 0 ? "hidden lg:block" : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
