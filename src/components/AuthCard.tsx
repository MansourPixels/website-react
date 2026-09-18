import type { ReactNode } from "react";
import { Link } from "react-router";

// Só a moldura: logotipo e cartão central. Fica de fora de propósito a lógica
// do `(auth)/layout.tsx` — o redirecionamento de quem já está logado —, porque
// há páginas públicas (o descadastro do e-mail) que precisam abrir igual com ou
// sem sessão e reaproveitam este visual sem herdar aquele comportamento.
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <Link
        to="/"
        className="flex items-center gap-2 rounded-full outline-accent outline-offset-4 focus-visible:outline-2"
      >
        <img src="/logo.svg" alt="" className="size-8" />
        <span className="text-lg font-semibold">Revi</span>
        <span className="sr-only">Voltar para a página inicial</span>
      </Link>

      <div className="flex w-full max-w-sm flex-col gap-6 rounded-3xl bg-surface p-6 shadow-surface">
        {children}
      </div>
    </main>
  );
}
