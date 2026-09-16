import { Button, Modal } from "@heroui/react";
import { LogOut, Trash } from "lucide-react";
import { useEffect, useState } from "react";

import { deleteClassroom, leaveClassroom } from "@/api/classrooms";
import { ApiError } from "@/api/client";
import { useFeedback } from "@/hooks/useFeedback";
import type { Classroom } from "@/types/api/classroom";

interface DialogLeaveClassroomProps {
  classroom: Classroom;
  /** `"leave"` para membro; `"delete"` para o dono encerrar a turma. */
  action: "leave" | "delete";
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
}

export function DialogLeaveClassroom({
  classroom,
  action,
  isOpen,
  onOpenChange,
  onConfirm,
}: DialogLeaveClassroomProps) {
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (isOpen) setError(null);
  }, [isOpen]);

  const feedback = useFeedback();
  const isDeleting = action === "delete";

  async function handleConfirm() {
    if (isBusy) return;

    setIsBusy(true);
    setError(null);

    try {
      if (isDeleting) {
        await deleteClassroom(classroom.id);
      } else {
        await leaveClassroom(classroom.id);
      }

      feedback("exclusao");
      onConfirm();
      onOpenChange(false);
    } catch (apiError) {
      feedback("erro");
      setError(
        apiError instanceof ApiError
          ? apiError.detail
          : isDeleting
            ? "Não foi possível excluir a turma. Tente novamente."
            : "Não foi possível sair da turma. Tente novamente.",
      );
    } finally {
      setIsBusy(false);
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
                {isDeleting ? (
                  <Trash className="size-5" />
                ) : (
                  <LogOut className="size-5" />
                )}
              </Modal.Icon>
              <Modal.Heading>
                {isDeleting
                  ? `Excluir ${classroom.name}`
                  : `Sair de ${classroom.name}`}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-2">
              <p className="text-muted">
                {isDeleting ? (
                  <>
                    As{" "}
                    <span className="tabular-nums">
                      {classroom.folderCount}
                    </span>{" "}
                    {classroom.folderCount === 1 ? "pasta" : "pastas"} e todo o
                    conteúdo da turma serão excluídos para os{" "}
                    <span className="tabular-nums">
                      {classroom.memberCount}
                    </span>{" "}
                    membros. Esta ação não pode ser desfeita.
                  </>
                ) : (
                  "Você perde o acesso a todas as pastas e conteúdos desta turma. Para voltar, vai precisar de um novo convite."
                )}
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
                isDisabled={isBusy}
              >
                {isDeleting ? "Excluir turma" : "Sair da turma"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
