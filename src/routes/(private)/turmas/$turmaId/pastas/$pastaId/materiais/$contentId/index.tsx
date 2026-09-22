import { Spinner } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";

import { getClassroom, getFolder } from "@/api/classrooms";
import { ApiError } from "@/api/client";
import { classroomMediaSource } from "@/api/mediaSource";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { MediaMaterialView } from "@/components/media/MediaMaterialView";
import { NavMenu } from "@/components/NavMenu";
import type { Classroom, ClassroomFolder } from "@/types/api/classroom";
import { canRegenerateMedia } from "@/utils/classroomPermissions";
import { pageMeta } from "@/utils/pageMeta";

export function meta() {
  return pageMeta({
    title: "Áudio ou vídeo da turma",
    description:
      "Resumo, momentos-chave, transcrição, simulado, flashcards e mapa mental de um áudio ou vídeo da turma.",
  });
}

/**
 * O áudio ou vídeo de uma turma, com os mesmos recursos do material pessoal
 * (`MediaMaterialView`). Qualquer membro lê e responde o simulado; só dono e editor veem "Gerar
 * de novo". O papel vem da turma, e a tela só monta depois de conhecê-lo.
 */
export default function ClassroomMediaPage() {
  const { turmaId, pastaId, contentId } = useParams<
    "turmaId" | "pastaId" | "contentId"
  >() as { turmaId: string; pastaId: string; contentId: string };

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [folder, setFolder] = useState<ClassroomFolder | null>(null);
  const [error, setError] = useState<{ message: string; isMissing: boolean } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setClassroom(null);
    setFolder(null);
    setError(null);
    Promise.all([getClassroom(turmaId), getFolder(turmaId, pastaId)])
      .then(([classroomResult, folderResult]) => {
        if (cancelled) return;
        setClassroom(classroomResult);
        setFolder(folderResult);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError({
          message:
            caught instanceof ApiError
              ? caught.detail
              : "Não foi possível carregar a turma. Tente novamente.",
          isMissing: caught instanceof ApiError && caught.status === 404,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [turmaId, pastaId, reloadKey]);

  const canRegenerate = classroom !== null && canRegenerateMedia(classroom.role);
  const source = useMemo(
    () =>
      classroom === null
        ? null
        : classroomMediaSource(turmaId, pastaId, contentId, canRegenerate),
    [classroom, turmaId, pastaId, contentId, canRegenerate],
  );
  const backHref = `/turmas/${turmaId}/pastas/${pastaId}`;

  if (error !== null) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6 md:p-8">
        <NavMenu title="Áudio ou vídeo da turma" hasBackButton backHref={backHref} />
        {error.isMissing ? (
          <EmptyState>Esta turma ou pasta não existe ou você não faz parte dela.</EmptyState>
        ) : (
          <ErrorState onRetry={() => setReloadKey((key) => key + 1)}>{error.message}</ErrorState>
        )}
      </main>
    );
  }

  if (source === null || classroom === null || folder === null) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6 md:p-8">
        <NavMenu title="Áudio ou vídeo da turma" hasBackButton backHref={backHref} />
        <div className="flex items-center justify-center p-6" aria-busy="true">
          <Spinner size="lg" />
          <span className="sr-only">Carregando</span>
        </div>
      </main>
    );
  }

  return (
    <MediaMaterialView
      source={source}
      backHref={backHref}
      context={`${classroom.name} · ${folder.name}`}
    />
  );
}
