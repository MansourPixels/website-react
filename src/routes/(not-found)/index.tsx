import { buttonVariants } from "@heroui/styles";
import { Link } from "react-router";

import { pageMeta } from "@/utils/pageMeta";

export function meta() {
  return pageMeta({
    title: "Página não encontrada",
    description: "O endereço que você abriu não existe ou saiu do ar.",
  });
}

export default function NotFoundPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <section className="flex max-w-sm flex-col items-center gap-4 rounded-3xl bg-white p-6 text-center shadow-surface">
        <h1 className="text-xl font-semibold">Página não encontrada</h1>
        <p className="text-muted text-sm text-pretty">
          O endereço pode estar incorreto ou a página não existe mais. Volte
          para o início e continue por lá.
        </p>
        <Link to="/" className={buttonVariants({ variant: "primary" })}>
          Voltar para o início
        </Link>
      </section>
    </main>
  );
}
