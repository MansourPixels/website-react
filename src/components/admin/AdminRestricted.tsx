import { buttonVariants } from "@heroui/styles";
import { ShieldAlert } from "lucide-react";
import { Link } from "react-router";

/** O que quem não tem o papel `admin` vê em qualquer rota da área. */
export function AdminRestricted() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="size-14 rounded-2xl flex items-center justify-center bg-surface shadow-surface">
        <ShieldAlert className="size-7 text-muted" aria-hidden />
      </div>
      <h1 className="text-2xl font-semibold">Acesso restrito</h1>
      <p className="max-w-sm text-muted text-pretty">
        Esta área é só para a administração do Revi. Se você acha que deveria ter
        acesso, fale com quem administra a plataforma.
      </p>
      <Link to="/pastas" className={buttonVariants({ variant: "primary" })}>
        Voltar ao app
      </Link>
    </main>
  );
}
