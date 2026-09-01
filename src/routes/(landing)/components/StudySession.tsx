import { Music } from "lucide-react";

import { SessionTimer } from "@/components/SessionTimer";
import { SpotifyStrip } from "@/components/SpotifyStrip";
import { useStudySession } from "@/hooks/useStudySession";
import { ModeHeader } from "./ModeHeader";

const cycleChips = [
  "25 min foco",
  "5 min pausa",
  "15 min pausa longa",
  "4 ciclos",
];

export function StudySession() {
  const preview = useStudySession({ persist: false, feedback: false });

  return (
    <section
      id="sessao"
      className="mx-auto w-full max-w-6xl scroll-mt-28 px-6 py-8 md:px-8 lg:py-12"
    >
      <header className="max-w-2xl">
        <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
          Um cronômetro que também aperta o play.
        </h2>
        <p className="mt-4 leading-relaxed text-pretty text-muted">
          Você escolhe quanto tempo de foco e quanto de pausa. Se o Spotify
          estiver conectado, a música começa com o foco e para na pausa.
        </p>
      </header>

      <div className="mt-10 grid gap-4 lg:grid-cols-12 lg:gap-5">
        <article className="reveal flex flex-col gap-5 rounded-3xl bg-white p-5 shadow-surface md:p-6 lg:col-span-7">
          <SessionTimer
            phase={preview.phase}
            status={preview.status}
            remainingMs={preview.remainingMs}
            totalMs={preview.totalMs}
            completedFocus={preview.completedFocus}
            cycleInRound={preview.cycleInRound}
            cyclesUntilLongBreak={preview.settings.cyclesUntilLongBreak}
            announcement={preview.announcement}
            onToggle={preview.toggle}
            onReset={preview.reset}
            onSkip={preview.skip}
            isCompact
          />

          <p className="text-sm leading-relaxed text-pretty text-muted">
            É o mesmo cronômetro que roda dentro do app. Pode apertar.
          </p>
        </article>

        <div className="flex flex-col gap-4 lg:col-span-5 lg:gap-5">
          <article className="reveal flex flex-col gap-5 rounded-3xl bg-white p-5 shadow-surface md:p-6">
            <ModeHeader
              icon={Music}
              iconClass="bg-accent"
              name="O Spotify entra quando o foco começa"
              description="Play no foco, pause na pausa"
            />

            <SpotifyStrip
              status="disconnected"
              profile={null}
              nowPlaying={null}
              issue={null}
              isConfigured
            />

            <p className="text-sm leading-relaxed text-pretty text-muted">
              Precisa de Spotify Premium e de um aparelho já tocando.
            </p>
          </article>

          <article className="reveal flex flex-1 flex-col gap-5 rounded-3xl bg-white p-5 shadow-surface md:p-6">
            <h3 className="font-semibold">Ciclos e pausas do seu jeito</h3>

            <ul className="flex flex-wrap gap-2">
              {cycleChips.map((chip) => (
                <li
                  key={chip}
                  className="rounded-full bg-default px-3 py-1 text-xs font-medium tabular-nums text-muted"
                >
                  {chip}
                </li>
              ))}
            </ul>

            <p className="text-sm leading-relaxed text-pretty text-muted">
              Os padrões são um ponto de partida. Foco, pausa curta, pausa longa
              e quantos ciclos até descansar de verdade — tudo ajustável.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
