import { Spinner } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link, Outlet } from "react-router";

import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { AdminRestricted } from "@/components/admin/AdminRestricted";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { adminGate } from "@/utils/adminGate";

/**
 * A área de administração. O portão só decide o que mostrar: quem protege de
 * verdade é o backend (`403` em `/api/admin/**`). Enquanto o papel não é
 * conhecido, e para quem não é admin, as rotas filhas nem são montadas, então
 * nenhuma chamada de admin sai do navegador.
 */
export default function AdminLayout() {
  const access = useAdminAccess();
  const gate = adminGate(access.status, access.isAdmin);

  if (gate === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center p-6" aria-busy="true">
        <Spinner size="lg" />
        <span className="sr-only">Verificando o acesso</span>
      </div>
    );
  }

  if (gate === "denied") return <AdminRestricted />;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-2 text-sm">
        <span className="flex items-center gap-2 font-medium text-muted">
          <ShieldCheck className="size-4" aria-hidden />
          Administração
        </span>
        <Link
          to="/perfil"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Voltar ao app
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-4 pt-3 md:flex-row md:gap-8 md:px-6 md:pt-6">
        <aside className="md:w-60 md:shrink-0">
          <AdminNavigation />
        </aside>
        <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 pb-10 md:px-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
