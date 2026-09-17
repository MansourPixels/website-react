import { Button, Modal } from "@heroui/react";
import { UserMinus } from "lucide-react";
import { useEffect, useState } from "react";

import { removeMember } from "@/api/classrooms";
import { ApiError } from "@/api/client";
import { useFeedback } from "@/hooks/useFeedback";
import type { ClassroomMember } from "@/types/api/classroom";

interface DialogMemberRemovalProps {
  member: ClassroomMember;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (member: ClassroomMember) => void;
}

export function DialogMemberRemoval({
  member,
  isOpen,
  onOpenChange,
  onConfirm,
}: DialogMemberRemovalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    if (isOpen) setError(null);
  }, [isOpen]);

  const feedback = useFeedback();

  async function handleConfirm() {
    if (isRemoving) return;

    setIsRemoving(true);
    setError(null);

    try {
      await removeMember(member.classroomId, member.id);

      feedback("exclusao");
      onConfirm(member);
      onOpenChange(false);
    } catch (apiError) {
      if (apiError instanceof ApiError && apiError.status === 404) {
        onConfirm(member);
        onOpenChange(false);
        return;
      }

      feedback("erro");
      setError(
        apiError instanceof ApiError
          ? apiError.detail
          : "Não foi possível remover o membro. Tente novamente.",
      );
    } finally {
      setIsRemoving(false);
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
                <UserMinus className="size-5" />
              </Modal.Icon>
              <Modal.Heading>Remover @{member.user.username}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-2">
              <p className="text-muted">
                Ao sair da turma, essa pessoa perde o acesso a todas as pastas e
                conteúdos. O que ela publicou continua na turma.
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
                isDisabled={isRemoving}
              >
                Remover
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
