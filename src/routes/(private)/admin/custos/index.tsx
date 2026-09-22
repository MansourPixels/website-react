import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { pageMeta } from "@/utils/pageMeta";

export function meta() {
  return pageMeta({ title: "Custos · Administração", description: "Administração do Revi." });
}

// Provisório: a tela desta seção chega na próxima entrega da área de admin.
export default function AdminSectionPage() {
  return (
    <>
      <AdminPageHeader title="Custos" />
      <p className="text-muted">Esta seção chega na próxima entrega da área de administração.</p>
    </>
  );
}
