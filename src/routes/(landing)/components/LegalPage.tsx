import { LandingFooter } from "./LandingFooter";
import { LandingNav } from "./LandingNav";

export interface LegalSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

// Tipografia do corpo aplicada uma vez aqui, para que cada documento escreva
// apenas <p>, <ul>, <strong> e <a> sem repetir classe nenhuma. A medida de
// leitura fica em 68ch: é prosa jurídica longa, e abaixo disso a quantidade de
// quebras atrapalha mais do que a linha comprida.
const BODY_STYLES = [
  "max-w-[68ch] space-y-4 leading-relaxed text-pretty text-muted",
  "[&_strong]:font-semibold [&_strong]:text-foreground",
  "[&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:pt-2",
  "[&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5",
  "[&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5",
  "[&_a]:text-accent [&_a]:underline [&_a]:underline-offset-4",
  "[&_a]:rounded-sm [&_a]:outline-accent [&_a:focus-visible]:outline-2",
].join(" ");

export function LegalPage({
  title,
  description,
  updatedAt,
  sections,
}: {
  title: string;
  description: string;
  updatedAt: string;
  sections: LegalSection[];
}) {
  return (
    <div className="flex flex-1 flex-col">
      <LandingNav sectionHrefPrefix="/" />

      <main className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-6 py-8 md:px-8 lg:py-12">
          <p className="text-sm font-medium text-accent">Revi</p>
          <h1 className="mt-2 max-w-[20ch] text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-[52ch] leading-relaxed text-pretty text-muted">
            {description}
          </p>
          <p className="mt-6 text-sm text-muted">
            Última atualização: <strong className="font-medium text-foreground">{updatedAt}</strong>
          </p>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pb-8 md:px-8">
          <nav
            aria-label="Seções deste documento"
            className="rounded-3xl bg-surface p-6 shadow-surface"
          >
            <h2 className="text-sm font-semibold">Neste documento</h2>
            <ol className="mt-4 grid list-decimal gap-x-8 gap-y-2 pl-5 text-sm md:grid-cols-2">
              {sections.map(({ id, title: sectionTitle }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="rounded-sm text-muted underline-offset-4 outline-accent hover:underline focus-visible:outline-2"
                  >
                    {sectionTitle}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </section>

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-8 md:px-8 lg:pb-12">
          {sections.map(({ id, title: sectionTitle, body }) => (
            <section
              key={id}
              id={id}
              aria-labelledby={`${id}-titulo`}
              className="scroll-mt-28 rounded-3xl bg-surface p-6 shadow-surface md:p-8"
            >
              <h2
                id={`${id}-titulo`}
                className="max-w-[32ch] text-xl font-semibold tracking-tight text-balance"
              >
                {sectionTitle}
              </h2>
              <div className={`mt-4 ${BODY_STYLES}`}>{body}</div>
            </section>
          ))}
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
