import {
  Camera,
  GraduationCap,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

interface Step {
  icon: LucideIcon;
  title: string;
  body: string;
}

const steps: Step[] = [
  {
    icon: Camera,
    title: "Fotografe",
    body: "Câmera em tela cheia, com flash e acesso à galeria. Caderno, lousa, apostila ou PDF de exercícios.",
  },
  {
    icon: Sparkles,
    title: "O Revi IA arquiva",
    body: "Ele sugere a disciplina e o assunto da foto. Se errar, você corrige antes de salvar, e pode criar uma pasta nova ali mesmo.",
  },
  {
    icon: GraduationCap,
    title: "Estude",
    body: "Dentro do assunto, o material vira flash cards, resumo ou simulado de prova. Sem redigitar uma linha.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="mx-auto w-full max-w-6xl scroll-mt-28 px-6 py-8 md:px-8 lg:py-12"
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,21rem)_1fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            Da foto ao estudo, sem digitar nada.
          </h2>
          <p className="mt-4 max-w-[42ch] leading-relaxed text-pretty text-muted">
            O conteúdo é o que o seu professor cobrou. O Revi só encurta o
            caminho entre a foto e o estudo.
          </p>
        </div>

        <ol className="flex flex-col">
          {steps.map(({ icon: Icon, title, body }, index) => {
            const isLast = index === steps.length - 1;

            return (
              <li
                key={title}
                className="reveal relative grid grid-cols-[3rem_1fr] gap-x-5 pb-10 last:pb-0 sm:gap-x-6"
              >
                {isLast ? null : (
                  <span
                    aria-hidden="true"
                    className="absolute top-14 bottom-0 left-6 border-l"
                  />
                )}

                <span className="flex size-12 items-center justify-center rounded-full bg-surface text-accent shadow-surface">
                  <Icon className="size-5" />
                </span>

                <div className="pt-2.5">
                  <h3 className="text-xl font-semibold">{title}</h3>
                  <p className="mt-2 max-w-[52ch] leading-relaxed text-pretty text-muted">
                    {body}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
