import { ascension, type AscensionDayState } from "@/mocks/ascension";
import { performance } from "@/mocks/performance";
import { cn, Meter } from "@heroui/react";
import { Check, Flame, Minus, Route as Path } from "lucide-react";

const dayStyles: Record<AscensionDayState, string> = {
  done: "bg-accent text-accent-foreground",
  today: "bg-accent-soft text-accent border-2 border-accent",
  missed: "bg-zinc-100 text-zinc-400",
  future: "bg-zinc-100 text-zinc-300",
};

const dayIcons: Record<AscensionDayState, typeof Check> = {
  done: Check,
  today: Flame,
  missed: Minus,
  future: Minus,
};

const dayDescriptions: Record<AscensionDayState, string> = {
  done: "estudou",
  today: "hoje",
  missed: "sem estudo",
  future: "ainda por vir",
};

function accuracyColor(accuracy: number) {
  if (accuracy >= 75) return "success" as const;
  if (accuracy >= 50) return "accent" as const;
  return "warning" as const;
}

const highlighted = ["Sociologia", "Matemática", "Português"];
const disciplines = performance.disciplines.filter(({ name }) =>
  highlighted.includes(name),
);

export function Progress() {
  return (
    <section
      id="acompanhamento"
      className="mx-auto w-full max-w-6xl scroll-mt-28 px-6 py-8 md:px-8 lg:py-12"
    >
      <header className="max-w-2xl">
        <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
          Voltar amanhã é o que o Revi mede.
        </h2>
        <p className="mt-4 leading-relaxed text-pretty text-muted">
          Duas telas cuidam disso: uma guarda a constância, a outra mostra onde
          você está perdendo ponto.
        </p>
      </header>

      <div className="mt-10 grid gap-4 lg:grid-cols-2 lg:gap-5">
        <article className="reveal flex flex-col gap-5 rounded-3xl bg-surface p-5 shadow-surface md:p-6">
          <header className="flex items-start gap-4">
            <img src="/icone-ascensao.svg" alt="" className="size-9 shrink-0" />
            <div>
              <h3 className="font-semibold">Ascensão</h3>
              <p className="mt-1 text-sm leading-relaxed text-pretty text-muted">
                A sequência conta os dias seguidos de estudo. Recorde, marcos e
                congelamentos ficam na mesma tela.
              </p>
            </div>
          </header>

          <ul className="grid grid-cols-7 gap-1">
            {ascension.week.map(({ label, state }) => {
              const Icon = dayIcons[state];

              return (
                <li
                  key={label}
                  className="flex min-w-0 flex-col items-center gap-2"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex aspect-square w-full max-w-10 items-center justify-center rounded-full md:max-w-12",
                      dayStyles[state],
                    )}
                  >
                    <Icon className="size-4 sm:size-5" />
                  </span>
                  <span className="text-xs text-muted">
                    {label}
                    <span className="sr-only">: {dayDescriptions[state]}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </article>

        <article className="reveal flex flex-col gap-5 rounded-3xl bg-surface p-5 shadow-surface md:p-6">
          <header className="flex items-start gap-4">
            <Path className="size-9 shrink-0 p-1.5 text-accent" />
            <div>
              <h3 className="font-semibold">Trilha</h3>
              <p className="mt-1 text-sm leading-relaxed text-pretty text-muted">
                Aproveitamento por disciplina e minutos na semana. Onde o
                percentual cai, o Revi IA sugere um plano de estudos.
              </p>
            </div>
          </header>

          <ul className="flex flex-col gap-4">
            {disciplines.map(({ name, accuracy }) => (
              <li key={name} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3">
                  <h4 className="font-medium">{name}</h4>
                  <span className="text-sm font-semibold tabular-nums">
                    {accuracy}%
                  </span>
                </div>

                <Meter
                  value={accuracy}
                  color={accuracyColor(accuracy)}
                  aria-label={`${name}: ${accuracy}% de aproveitamento`}
                >
                  <Meter.Track>
                    <Meter.Fill />
                  </Meter.Track>
                </Meter>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
