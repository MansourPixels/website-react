import { Link } from "react-router";

const appLinks = [
  { to: "/capturar", label: "Capturar" },
  { to: "/pastas", label: "Pastas" },
  { to: "/ascensao", label: "Ascensão" },
  { to: "/trilha", label: "Trilha" },
] as const;

export function LandingFooter() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-6 pb-10 md:px-8">
      <div className="flex flex-col gap-6 border-t pt-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="" className="size-8" />
          <p className="text-sm text-muted">
            <span className="font-semibold text-foreground">Revi</span>
            <br />
            Do caderno ao estudo, em uma foto.
          </p>
        </div>

        <nav aria-label="Telas do aplicativo">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {appLinks.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="rounded-sm text-muted underline-offset-4 outline-accent hover:underline focus-visible:outline-2"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <p className="mt-8 text-xs text-muted">© 2026 Revi</p>
    </footer>
  );
}
