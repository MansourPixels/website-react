import { buttonVariants } from "@heroui/styles";
import { Link } from "react-router";

export function FinalCta() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-8 md:px-8 lg:pb-12">
      <div className="reveal flex flex-col items-center gap-6 rounded-3xl bg-white px-6 py-14 text-center shadow-surface md:py-20">
        <h2 className="max-w-[18ch] text-3xl font-semibold tracking-tight text-balance md:text-4xl">
          Comece pelo material que você já tem.
        </h2>
        <p className="max-w-[52ch] leading-relaxed text-pretty text-muted">
          Abra a câmera, fotografe a página e deixe o resto com o Revi.
        </p>
        <Link
          to="/auth/cadastro"
          className={buttonVariants({ variant: "primary", size: "lg" })}
        >
          Começar a estudar
        </Link>
      </div>
    </section>
  );
}
