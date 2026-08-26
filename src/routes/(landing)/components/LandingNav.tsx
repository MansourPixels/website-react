import { buttonVariants } from "@heroui/styles";
import { Link } from "react-router";

const sections = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#modos", label: "Modos de estudo" },
  { href: "#acompanhamento", label: "Acompanhamento" },
];

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 px-4 pt-4 md:px-6">
      <nav
        aria-label="Navegação da página"
        className="mx-auto flex h-16 max-w-6xl items-center gap-2 rounded-full border bg-white pr-3 pl-4 shadow-surface md:pl-6"
      >
        <a
          href="#topo"
          className="flex shrink-0 items-center gap-2 rounded-full outline-offset-4 outline-accent focus-visible:outline-2"
        >
          <img src="/favicon.svg" alt="" className="size-8" />
          <span className="text-lg font-semibold">Revi</span>
          <span className="sr-only">Voltar ao topo</span>
        </a>

        <ul className="mx-auto hidden items-center gap-1 lg:flex">
          {sections.map(({ href, label }) => (
            <li key={href}>
              <a
                href={href}
                className={buttonVariants({
                  variant: "ghost",
                  className: "text-muted",
                })}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex shrink-0 items-center gap-1 lg:ml-0 sm:gap-2">
          <Link to="/auth/entrar" className={buttonVariants({ variant: "ghost" })}>
            Entrar
          </Link>
          <Link
            to="/auth/cadastro"
            className={buttonVariants({ variant: "primary" })}
          >
            <span className="sm:hidden">Começar</span>
            <span className="hidden sm:inline">Começar a estudar</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
