import { NavMenu } from "@/components/NavMenu";
import { ApiError } from "@/api/client";
import { getStudyPlan } from "@/api/studyPlan";
import { groupProgress, groupStepsByDiscipline } from "@/utils/studyPlan";
import { Spinner, Meter } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { CircleStar, Flame } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { PlanStepRow } from "./components/PlanStepRow";

export default function StudyPlanPage() {
  const { planoId } = useParams<"planoId">() as { planoId: string };

  const [groups, setGroups] = useState<
    ReturnType<typeof groupStepsByDiscipline> | null
  >(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getStudyPlan()
      .then((result) => {
        if (!cancelled) setGroups(groupStepsByDiscipline(result.steps));
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

  if (loadError !== null) {
    return (
      <main className="p-6 md:p-8 gap-6 flex flex-col w-full max-w-3xl mx-auto">
        <NavMenu title="Plano de estudos" hasBackButton />
        <p className="text-danger text-center py-8">{loadError}</p>
      </main>
    );
  }

  if (groups === null) {
    return (
      <main className="p-6 md:p-8 gap-6 flex flex-col w-full max-w-3xl mx-auto flex-1 items-center justify-center">
        <Spinner size="lg" />
        <span className="sr-only">Carregando plano</span>
      </main>
    );
  }

  const group = groups.find((item) => item.motherFolderId === planoId);

  if (group === undefined) {
    return (
      <main className="p-6 md:p-8 gap-6 flex flex-col w-full max-w-3xl mx-auto">
        <NavMenu title="Plano de estudos" hasBackButton />
        <section className="bg-white rounded-3xl shadow-surface p-6 flex flex-col items-center gap-3 text-center">
          <h2 className="text-xl font-semibold">Plano não encontrado</h2>
          <p className="text-muted text-balance">
            Esse plano não existe mais ou o endereço está incorreto. Volte para
            a Trilha e escolha um plano sugerido pela Revi IA.
          </p>
          <Link to="/trilha" className={buttonVariants({ variant: "primary" })}>
            Voltar à Trilha
          </Link>
        </section>
      </main>
    );
  }

  const { completed, total, isComplete, nextStep } = groupProgress(group.steps);

  return (
    <main className="p-6 md:p-8 gap-6 flex flex-col w-full max-w-3xl mx-auto">
      <NavMenu title="Plano de estudos" hasBackButton />

      <section className="bg-accent-soft rounded-3xl p-4 md:p-6 flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <h2 className="text-2xl md:text-3xl font-semibold text-accent text-balance">
            {group.motherFolderName}
          </h2>
          <p className="text-sm text-accent-soft-foreground text-pretty">
            Plano sugerido pela Revi IA para reforçar esta disciplina.
          </p>
        </header>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3 text-sm text-accent-soft-foreground">
            <span>Progresso do plano</span>
            <span className="tabular-nums font-semibold">
              {completed} de {total} etapas
            </span>
          </div>
          <Meter
            value={completed}
            maxValue={total}
            color={isComplete ? "success" : "accent"}
            aria-label={`Progresso do plano: ${completed} de ${total} etapas`}
          >
            <Meter.Track>
              <Meter.Fill />
            </Meter.Track>
          </Meter>
        </div>
      </section>

      {isComplete ? (
        <section className="bg-white rounded-3xl shadow-surface p-6 flex flex-col items-center gap-3 text-center">
          <span
            aria-hidden
            className="size-16 rounded-full bg-accent text-accent-foreground flex items-center justify-center"
          >
            <Flame className="size-8" />
          </span>
          <h2 className="text-2xl font-semibold">Plano concluído</h2>
          <p className="text-muted text-balance max-w-md">
            Você fechou as {total} etapas de {group.motherFolderName}. Gerar
            uma nova trilha na página inicial recalcula suas disciplinas mais
            fracas.
          </p>
          <Link
            to="/trilha"
            className={buttonVariants({ variant: "primary", fullWidth: true })}
          >
            Voltar à Trilha
          </Link>
        </section>
      ) : null}

      <section id="etapas" className="flex flex-col gap-3">
        <h2 className="font-semibold">Etapas</h2>
        <ol className="flex flex-col gap-3">
          {group.steps.map((step, index) => (
            <PlanStepRow
              key={step.id}
              planoId={planoId}
              step={step}
              position={index + 1}
              isNext={nextStep?.id === step.id}
            />
          ))}
        </ol>
      </section>

      {!isComplete && nextStep ? (
        <footer className="flex flex-col gap-3">
          <Link
            to={`/trilha/plano/${planoId}/etapa/${nextStep.id}`}
            className={buttonVariants({ variant: "primary", fullWidth: true })}
          >
            <CircleStar />
            Continuar o plano
          </Link>
        </footer>
      ) : null}
    </main>
  );
}
