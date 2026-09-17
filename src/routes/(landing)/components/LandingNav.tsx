import { buttonVariants } from "@heroui/styles";
import { Link } from "react-router";

// Os rótulos encurtaram para caber em uma linha só depois das seções novas, mas
// os `id` das âncoras continuam os mesmos: as páginas legais voltam para a
// landing por eles. A seção do Google fica de fora para o menu não estourar.
const sections = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#modos", label: "Modos de estudo" },
  { href: "#sessao", label: "Sessão" },
  { href: "#acompanhamento", label: "Progresso" },
  { href: "#turmas", label: "Turmas" },
  { href: "#equipe", label: "Equipe" },
];

// `sectionHrefPrefix` existe para as páginas que usam este cabeçalho fora da
// landing (política de privacidade e termos): lá as âncoras nuas não casam com
// nenhuma seção da página e só trocariam o hash. Com o prefixo "/", cada item
// vira uma navegação de volta à landing na âncora certa.
export function LandingNav({
  sectionHrefPrefix = "",
}: {
  sectionHrefPrefix?: string;
}) {
  const isOnLanding = sectionHrefPrefix === "";

  return (
    <header className="sticky top-0 z-40 px-4 pt-4 md:px-6">
      <nav
        aria-label="Navegação da página"
        className="mx-auto flex h-16 max-w-6xl items-center gap-2 rounded-full border bg-surface pr-3 pl-4 shadow-surface md:pl-6"
      >
        <SectionLink
          href="#topo"
          prefix={sectionHrefPrefix}
          className="flex shrink-0 items-center gap-2 rounded-full outline-offset-4 outline-accent focus-visible:outline-2"
        >
          <img src="/logo.svg" alt="" className="size-8" />
          <span className="text-lg font-semibold">Revi</span>
          <span className="sr-only">
            {isOnLanding ? "Voltar ao topo" : "Ir para a página inicial"}
          </span>
        </SectionLink>

        <ul className="mx-auto hidden items-center gap-1 xl:flex">
          {sections.map(({ href, label }) => (
            <li key={href}>
              <SectionLink
                href={href}
                prefix={sectionHrefPrefix}
                className={buttonVariants({
                  variant: "ghost",
                  className: "text-muted",
                })}
              >
                {label}
              </SectionLink>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2 xl:ml-0">
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

// Na própria landing continua sendo uma âncora comum, para preservar a rolagem
// suave do navegador; fora dela precisa ser um Link, senão o react-router não
// troca de rota.
function SectionLink({
  href,
  prefix,
  className,
  children,
}: {
  href: string;
  prefix: string;
  className?: string;
  children: React.ReactNode;
}) {
  if (prefix === "") {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link to={`${prefix}${href}`} className={className}>
      {children}
    </Link>
  );
}
