import { Button, Spinner } from "@heroui/react";
import { CircleStar, ListCheck, SquareCheck, Target } from "lucide-react";
import { useEffect, useState } from "react";

import { ApiError } from "@/api/client";
import { getByDiscipline, getOverview } from "@/api/performance";
import { generateStudyPlan, getStudyPlan } from "@/api/studyPlan";
import { NavMenu } from "@/components/NavMenu";
import { StatTile } from "@/components/StatTile";
import type {
  PerformanceByDiscipline,
  PerformanceOverview,
} from "@/types/api/performance";
import type { StudyPlan } from "@/types/api/studyPlan";
import { groupStepsByDiscipline } from "@/utils/studyPlan";
import { DialogSelecionarDisciplinas } from "./components/DialogSelecionarDisciplinas";
import { DisciplinePerformanceList } from "./components/DisciplinePerformanceList";
import { StudyPlanCard } from "./components/StudyPlanCard";

const GENERATE_POLL_INTERVAL_MS = 3_000;
const GENERATE_POLL_TIMEOUT_MS = 30_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function PathPage() {
  const [overview, setOverview] = useState<PerformanceOverview | null>(null);
  const [disciplines, setDisciplines] = useState<
    PerformanceByDiscipline[] | null
  >(null);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [isSelectDisciplinesOpen, setIsSelectDisciplinesOpen] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getOverview(), getByDiscipline(), getStudyPlan()])
      .then(([overviewResult, disciplinesResult, planResult]) => {
        if (cancelled) return;

        setOverview(overviewResult);
        setDisciplines(disciplinesResult);
        setPlan(planResult);
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        setLoadError(
          error instanceof ApiError
            ? error.detail
            : "Não foi possível carregar a trilha. Tente novamente.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleGenerate(motherFolderIds?: string[]) {
    setIsGenerating(true);
    setGenerateError(null);

    const previousGeneratedAt = plan?.generatedAt ?? null;

    try {
      await generateStudyPlan(motherFolderIds);

      const startedAt = Date.now();

      while (true) {
        await sleep(GENERATE_POLL_INTERVAL_MS);

        const result = await getStudyPlan();
        const timedOut = Date.now() - startedAt > GENERATE_POLL_TIMEOUT_MS;

        if (result.generatedAt !== previousGeneratedAt || timedOut) {
          setPlan(result);
          break;
        }
      }
    } catch (error) {
      setGenerateError(
        error instanceof ApiError
          ? error.detail
          : "Não foi possível gerar a trilha. Tente novamente.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  const attentionPoints = (disciplines ?? [])
    .filter((discipline) => discipline.accuracyPercentage < 60)
    .map((discipline) => discipline.motherFolderName);

  const groups = plan !== null ? groupStepsByDiscipline(plan.steps) : [];

  return (
    <main className="p-6 gap-8 flex flex-col w-full max-w-6xl mx-auto">
      <NavMenu title="Trilha" />

      {loadError !== null ? (
        <p className="text-danger text-center py-8">{loadError}</p>
      ) : overview === null || disciplines === null || plan === null ? (
        <div
          className="flex flex-1 items-center justify-center p-6"
          aria-busy="true"
        >
          <Spinner size="lg" />
          <span className="sr-only">Carregando trilha</span>
        </div>
      ) : (
        <>
          <div className="grid bg-accent-soft p-4 rounded-3xl items-center gap-4 sm:grid-cols-2">
            <h2 className="grid min-w-0">
              <span className="text-7xl font-extrabold text-transparent bg-clip-text bg-background dark:bg-white [-webkit-text-stroke:3px_var(--accent)] tabular-nums">
                {Math.round(overview.accuracyPercentage)}%
              </span>
              <span className="text-2xl text-accent font-semibold text-balance">
                de aproveitamento geral
              </span>
            </h2>
            <p className="text-accent-soft-foreground text-sm text-balance">
              {overview.totalAttempts > 0
                ? `Baseado em ${overview.totalAttempts} ${overview.totalAttempts === 1 ? "simulado respondido" : "simulados respondidos"}, somando todas as disciplinas.`
                : "Responda um simulado para começar a acompanhar seu aproveitamento."}
            </p>
          </div>

          <section
            id="indicadores-gerais"
            className="grid grid-cols-2 lg:grid-cols-3 gap-3"
          >
            <StatTile
              label="Simulados feitos"
              value={`${overview.totalAttempts}`}
              hint="Em todas as disciplinas"
              icon={ListCheck}
            />
            <StatTile
              label="Perguntas respondidas"
              value={`${overview.totalQuestions}`}
              hint="Somando todos os simulados"
              icon={SquareCheck}
            />
            <StatTile
              label="Acertos"
              value={`${overview.totalCorrectAnswers}`}
              hint="Somando todos os simulados"
              icon={Target}
            />
          </section>

          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-start">
            <div className="flex flex-col gap-8">
              <DisciplinePerformanceList disciplines={disciplines} />
            </div>

            <section id="plano-estudos" className="flex flex-col gap-4">
              <header className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold">
                  Plano de estudos sugerido
                </h2>
                <p className="text-sm">
                  {attentionPoints.length > 0 ? (
                    <>
                      Foi identificada uma queda de domínio nos assuntos
                      relacionados a{" "}
                      {attentionPoints.map((name, index) => (
                        <span key={name}>
                          {index > 0
                            ? index === attentionPoints.length - 1
                              ? " e "
                              : ", "
                            : null}
                          <strong>{name}</strong>
                        </span>
                      ))}
                      . Vamos focar para melhorar isso? 😎
                    </>
                  ) : plan.generatedAt !== null ? (
                    "Nenhuma disciplina pedindo atenção no momento. Continue assim! 😎"
                  ) : (
                    "Gere sua trilha para receber um plano de estudos com base no seu desempenho."
                  )}
                </p>
              </header>

              {generateError !== null ? (
                <p role="alert" className="text-danger text-sm text-pretty">
                  {generateError}
                </p>
              ) : null}

              {plan.generatedAt === null ? (
                <Button
                  variant="primary"
                  fullWidth
                  onPress={() => setIsSelectDisciplinesOpen(true)}
                  isDisabled={isGenerating}
                >
                  <CircleStar />
                  {isGenerating ? "Gerando trilha..." : "Gerar trilha"}
                </Button>
              ) : groups.length === 0 ? (
                <>
                  <p className="text-muted text-sm">
                    Nenhuma disciplina elegível ainda — responda ao menos um
                    simulado para que a Revi IA possa sugerir um plano.
                  </p>

                  <Button
                    variant="primary"
                    fullWidth
                    onPress={() => setIsSelectDisciplinesOpen(true)}
                    isDisabled={isGenerating}
                  >
                    <CircleStar />
                    {isGenerating ? "Gerando trilha..." : "Gerar trilha"}
                  </Button>
                </>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                    {groups.map((group) => (
                      <StudyPlanCard key={group.motherFolderId} group={group} />
                    ))}
                  </div>

                  <Button
                    variant="ghost"
                    fullWidth
                    onPress={() => setIsSelectDisciplinesOpen(true)}
                    isDisabled={isGenerating}
                  >
                    <CircleStar />
                    {isGenerating ? "Gerando trilha..." : "Gerar nova trilha"}
                  </Button>
                </>
              )}
            </section>
          </div>
        </>
      )}

      <DialogSelecionarDisciplinas
        isOpen={isSelectDisciplinesOpen}
        onOpenChange={setIsSelectDisciplinesOpen}
        onGenerateAutomatic={() => handleGenerate()}
        onGenerateSelected={(motherFolderIds) =>
          handleGenerate(motherFolderIds)
        }
      />
    </main>
  );
}
