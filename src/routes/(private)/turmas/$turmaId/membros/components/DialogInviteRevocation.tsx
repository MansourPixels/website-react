import { Button, Modal } from "@heroui/react";
import { Trash } from "lucide-react";
import { useEffect, useState } from "react";

import { revokeInvite } from "@/api/classrooms";
import { ApiError } from "@/api/client";
import { useFeedback } from "@/hooks/useFeedback";
import type { ClassroomInvite } from "@/types/api/classroom";

interface DialogInviteRevocationProps {
  invite: ClassroomInvite;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (invite: ClassroomInvite) => void;
}

export function DialogInviteRevocation({
  invite,
  isOpen,
  onOpenChange,
  onConfirm,
}: DialogInviteRevocationProps) {
  const [error, setError] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  useEffect(() => {
    if (isOpen) setError(null);
  }, [isOpen]);

  const feedback = useFeedback();
  const isLink = invite.invitee === null;

  async function handleConfirm() {
    if (isRevoking) return;

    setIsRevoking(true);
    setError(null);

    try {
      await revokeInvite(invite.classroomId, invite.id);

      feedback("exclusao");
      onConfirm(invite);
      onOpenChange(false);
    } catch (apiError) {
      // 404: o convite já não existe (aceito ou revogado noutra sessão) — some
      // da lista em vez de travar num convite fantasma.
      if (apiError instanceof ApiError && apiError.status === 404) {
        onConfirm(invite);
        onOpenChange(false);
        return;
      }

      feedback("erro");
      setError(
        apiError instanceof ApiError
          ? apiError.detail
          : "Não foi possível revogar o convite. Tente novamente.",
      );
    } finally {
      setIsRevoking(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-90">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="bg-danger-soft text-danger">
                <Trash className="size-5" />
              </Modal.Icon>
              <Modal.Heading>
                {isLink
                  ? `Revogar link ${invite.code}`
                  : `Revogar convite de @${invite.invitee?.username}`}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-2">
              <p className="text-muted">
                {isLink
                  ? "Quem ainda não entrou por este link deixa de conseguir entrar. Você pode gerar outro link depois."
                  : "Esta pessoa deixa de conseguir entrar por este convite. Você pode convidá-la de novo depois."}
              </p>
              {error !== null ? (
                <p role="alert" className="text-danger text-sm text-pretty">
                  {error}
                </p>
              ) : null}
            </Modal.Body>
            <Modal.Footer className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                className="w-full"
                onPress={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                className="w-full"
                onPress={handleConfirm}
                isDisabled={isRevoking}
              >
                Revogar convite
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
