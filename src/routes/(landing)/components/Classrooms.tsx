import { defaultClassrooms } from "@/mocks/classrooms";
import { defaultRanking } from "@/mocks/ranking";
import { ClassroomCard } from "@/routes/(private)/turmas/components/ClassroomCard";
import { RankingRow } from "@/routes/(private)/ranking/components/RankingRow";
import {
  currentSeasonId,
  formatResetDate,
  formatSeasonLabel,
} from "@/utils/ranking";

const scopes = ["Global", "Amigos", "Turma"];

export function Classrooms() {
  // A temporada é o mês corrente de verdade, pelo mesmo utilitário que a tela
  // de ranking usa. É a única coisa viva desta seção.
  const season = formatSeasonLabel(currentSeasonId());
  const resetDate = formatResetDate();

  return (
    <section
      id="turmas"
      className="mx-auto w-full max-w-6xl scroll-mt-28 px-6 py-8 md:px-8 lg:py-12"
    >
      <header className="max-w-2xl">
        <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
          Do seu caderno para o da turma.
        </h2>
        <p className="mt-4 leading-relaxed text-pretty text-muted">
          Crie uma turma, convide por link ou por @username e compartilhe o
          material em pastas. O ranking fecha uma temporada por mês.
        </p>
      </header>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.9fr] lg:gap-5">
        {defaultClassrooms.map((classroom) => (
          <div key={classroom.id} className="reveal h-full">
            <ClassroomCard
              classroom={classroom}
              titleAs="p"
              to="/auth/cadastro"
            />
          </div>
        ))}

        {/* Em duas colunas o cartao de convite ocupa a linha inteira: sozinho
            na segunda linha, ele deixaria um vao do lado. */}
        <article className="reveal flex h-full flex-col gap-3 rounded-3xl bg-surface p-4 shadow-surface sm:col-span-2 lg:col-span-1">
          <h3 className="font-semibold">Entrar é por convite</h3>
          <p className="text-sm leading-relaxed text-pretty text-muted">
            O link abre a turma direto. Quem prefere digitar usa o código.
          </p>
          <span className="w-fit rounded-full bg-default px-3 py-1 text-sm font-medium">
            MAT3B2026
          </span>
          <p className="mt-auto text-xs leading-relaxed text-pretty text-muted">
            Dono gerencia membros e pastas, editor cuida do material, membro
            consome o que já está lá.
          </p>
        </article>
      </div>

      <div className="mt-12 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">Ranking da temporada</h3>
          <p className="mt-1 text-sm text-muted">
            Temporada de {season}. Zera em {resetDate}.
          </p>
        </div>

        <ul aria-label="Escopos do ranking" className="flex flex-wrap gap-2">
          {scopes.map((scope, index) => (
            <li
              key={scope}
              className={
                index === 0
                  ? "rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent-soft-foreground"
                  : "rounded-full bg-default px-3 py-1 text-sm text-muted"
              }
            >
              {scope}
            </li>
          ))}
        </ul>
      </div>

      {/* As linhas são o componente real do ranking, e por isso vivem sobre a
          mesa, não dentro de um cartão: empilhar superfície sobre superfície
          apagaria a borda de estado da linha destacada no tema escuro. */}
      <p className="sr-only" id="ranking-exemplo">
        Exemplo da tela de ranking do Revi, com a linha destacada mostrando a
        posição de quem está usando o aplicativo.
      </p>
      <ol
        aria-describedby="ranking-exemplo"
        className="mt-5 flex flex-col gap-2"
      >
        {defaultRanking.map((entry) => (
          <RankingRow key={entry.user.id} entry={entry} linkToProfile={false} />
        ))}
      </ol>

      <p className="mt-5 max-w-[62ch] text-sm leading-relaxed text-pretty text-muted">
        Global compara com todo mundo, Amigos só com quem você adicionou por
        @username, e Turma com quem estuda junto. Na virada do mês o XP zera e o
        campeão da temporada anterior fica registrado.
      </p>
    </section>
  );
}
