import { buttonVariants } from "@heroui/styles";
import { Link } from "react-router";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { pageMeta } from "@/utils/pageMeta";

export function meta() {
  return pageMeta({ title: "Cotas e planos · Administração", description: "Administração do Revi." });
}

/**
 * As cotas por plano ainda não existem no servidor (virão numa change própria
 * do backend). Até lá a seção só explica isso, sem chamar nenhum endpoint.
 */
export default function AdminQuotasPage() {
  return (
    <>
      <AdminPageHeader title="Cotas e planos" />
      <section className="flex flex-col items-start gap-3 rounded-2xl bg-surface p-4 shadow-surface">
        <h2 className="font-semibold">Em breve</h2>
        <p className="text-sm text-muted text-pretty">
          As cotas por plano ainda não existem no servidor. Enquanto isso, o relatório de custos mostra quanto cada
          usuário está gastando.
        </p>
        <Link to="/admin/custos" className={buttonVariants({ variant: "secondary", size: "sm" })}>
          Ver os custos
        </Link>
      </section>
    </>
  );
}
