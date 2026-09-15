import { Button, Spinner } from "@heroui/react";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { acceptInvite, declineInvite } from "@/api/classrooms";
import { ApiError } from "@/api/client";
import { useFeedback } from "@/hooks/useFeedback";
import type { Classroom, ClassroomInvite } from "@/types/api/classroom";
import { roleLabel } from "@/utils/classroomPermissions";
import { profilePath } from "@/utils/profile";

interface ClassroomInviteRowProps {
  invite: ClassroomInvite;
  onAccepted: (invite: ClassroomInvite, classroom: Classroom) => void;
  onDeclined: (invite: ClassroomInvite) => void;
}

export function ClassroomInviteRow({
  invite,
  onAccepted,
  onDeclined,
}: ClassroomInviteRowProps) {
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const feedback = useFeedback();

  async function handleAccept() {
    if (isBusy) return;

    setIsBusy(true);
    setError(null);

    try {
      const classroom = await acceptInvite(invite.id);

      feedback("sucesso");
      onAccepted(invite, classroom);
    } catch (apiError) {
      feedback("erro");
      setError(
        apiError instanceof ApiError
          ? apiError.detail
          : "Não foi possível aceitar o convite. Tente novamente.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDecline() {
    if (isBusy) return;

    setIsBusy(true);
    setError(null);

    try {
      await declineInvite(invite.id);
      onDeclined(invite);
    } catch (apiError) {
      feedback("erro");
      setError(
        apiError instanceof ApiError
          ? apiError.detail
          : "Não foi possível recusar o convite. Tente novamente.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <li className="bg-surface shadow-surface flex flex-col gap-3 rounded-xl p-3">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="size-9 shrink-0 rounded-xl"
          style={{ backgroundColor: invite.classroomColor }}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium">{invite.classroomName}</span>
          <span className="text-muted truncate text-xs">
            <Link
              to={profilePath(invite.invitedBy.username)}
              className="hover:underline"
            >
              @{invite.invitedBy.username}
            </Link>{" "}
            convidou você como {roleLabel(invite.role).toLowerCase()}
          </span>
        </div>

        {isBusy ? (
          <Spinner size="sm" />
        ) : (
          <div className="flex shrink-0 gap-2">
            <Button
              size="sm"
              aria-label={`Aceitar convite para ${invite.classroomName}`}
              onPress={handleAccept}
            >
              <Check className="size-4" />
              Aceitar
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="secondary"
              aria-label={`Recusar convite para ${invite.classroomName}`}
              onPress={handleDecline}
            >
              <X className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {error !== null ? (
        <p role="alert" className="text-danger text-sm text-pretty">
          {error}
        </p>
      ) : null}
    </li>
  );
}
