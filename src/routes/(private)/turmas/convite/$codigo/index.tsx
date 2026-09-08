import { Button, Spinner } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { acceptInvite, declineInvite, getInviteByCode } from "@/api/classrooms";
import { ApiError } from "@/api/client";
import { NavMenu } from "@/components/NavMenu";
import { UserIdentity } from "@/components/UserIdentity";
import { useFeedback } from "@/hooks/useFeedback";
import type { ClassroomInvitePreview } from "@/types/api/classroom";
import { roleDescription, roleLabel } from "@/utils/classroomPermissions";

export default function ClassroomInvitePage() {
  const { codigo } = useParams();
  const navigate = useNavigate();

  const [preview, setPreview] = useState<ClassroomInvitePreview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const feedback = useFeedback();

  useEffect(() => {
    if (codigo === undefined) return;

    let cancelled = false;

    getInviteByCode(codigo)
      .then((result) => {
        if (!cancelled) setPreview(result);
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        setLoadError(
          error instanceof ApiError
            ? error.detail
            : "Não foi possível abrir este convite. Tente novamente.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [codigo]);

  async function handleAccept() {
    if (preview === null || isBusy) return;

    setIsBusy(true);
    setActionError(null);

    try {
      const classroom = await acceptInvite(preview.inviteId);

      feedback("sucesso");
      navigate(`/turmas/${classroom.id}`, { replace: true });
    } catch (apiError) {
      feedback("erro");
      setActionError(
        apiError instanceof ApiError
          ? apiError.detail
          : "Não foi possível entrar na turma. Tente novamente.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDecline() {
    if (preview === null || isBusy) return;

    // Convite por link não tem destinatário para recusar — ele segue valendo
    // para outras pessoas. Aqui "recusar" é só desistir de entrar. Chamar o
    // endpoint de recusa nesse caso responderia 403 (a regra "só o convidado
    // recusa" nunca bate com um convite sem convidado).
    if (preview.invitee === null) {
      navigate("/turmas", { replace: true });
      return;
    }

    setIsBusy(true);
    setActionError(null);

    try {
      await declineInvite(preview.inviteId);
      navigate("/turmas", { replace: true });
    } catch (apiError) {
      feedback("erro");
      setActionError(
        apiError instanceof ApiError
          ? apiError.detail
          : "Não foi possível recusar o convite. Tente novamente.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 md:p-8">
      <NavMenu title="Convite" hasBackButton backHref="/turmas" />

      {loadError !== null ? (
        <div className="flex flex-col items-center gap-4 py-8">
          <p className="text-danger text-center text-pretty">{loadError}</p>
          <Link
            to="/turmas"
            className={buttonVariants({ variant: "secondary" })}
          >
            Voltar para turmas
          </Link>
        </div>
      ) : preview === null ? (
        <div className="flex flex-1 items-center justify-center p-6" aria-busy="true">
          <Spinner size="lg" />
          <span className="sr-only">Abrindo o convite</span>
        </div>
      ) : (
        <section className="bg-surface shadow-surface mx-auto flex w-full max-w-lg flex-col gap-6 rounded-3xl p-6">
          <header className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="size-11 shrink-0 rounded-2xl"
              style={{ backgroundColor: preview.classroomColor }}
            />
            <div className="flex min-w-0 flex-col">
              <h2 className="text-xl font-semibold text-balance">
                {preview.classroomName}
              </h2>
              <p className="text-muted text-sm tabular-nums">
                <Users className="mr-1 inline size-3.5" aria-hidden="true" />
                {preview.memberCount}{" "}
                {preview.memberCount === 1 ? "membro" : "membros"}
              </p>
            </div>
          </header>

          <div className="flex flex-col gap-2">
            {/* Só o dono convida (nominal ou por link) — owner e "quem convidou" são sempre a mesma pessoa. */}
            <p className="text-muted text-xs">Convite enviado por</p>
            <UserIdentity user={preview.owner} size="sm" linkToProfile />
          </div>

          <div className="bg-default flex flex-col gap-1 rounded-xl p-3">
            <p className="text-sm font-medium">
              Você entra como {roleLabel(preview.role).toLowerCase()}
            </p>
            <p className="text-muted text-xs text-pretty">
              {roleDescription(preview.role)}
            </p>
          </div>

          {actionError !== null ? (
            <p role="alert" className="text-danger text-sm text-pretty">
              {actionError}
            </p>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              variant="secondary"
              className="w-full"
              isDisabled={isBusy}
              onPress={handleDecline}
            >
              Recusar
            </Button>
            <Button
              className="w-full"
              isDisabled={isBusy}
              onPress={handleAccept}
            >
              {isBusy ? "Entrando…" : "Entrar na turma"}
            </Button>
          </div>
        </section>
      )}
    </main>
  );
}
