import { Button, Modal } from "@heroui/react";
import { Trash } from "lucide-react";
import { useEffect, useState } from "react";

import { deleteContent } from "@/api/classrooms";
import { ApiError } from "@/api/client";
import { useFeedback } from "@/hooks/useFeedback";
import type { ClassroomContent } from "@/types/api/classroom";

interface DialogContentExclusionProps {
  content: ClassroomContent;
  /** O dono está removendo conteúdo de outra pessoa — a copy precisa dizer. */
  isOwnerModerating: boolean;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (content: ClassroomContent) => void;
}

export function DialogContentExclusion({
  content,
  isOwnerModerating,
  isOpen,
  onOpenChange,
  onConfirm,
}: DialogContentExclusionProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) setError(null);
  }, [isOpen]);

  const feedback = useFeedback();

  async function handleConfirm() {
    if (isDeleting) return;

    setIsDeleting(true);
    setError(null);

    try {
      await deleteContent(content.classroomId, content.id);

      feedback("exclusao");
      onConfirm(content);
      onOpenChange(false);
    } catch (apiError) {
      if (apiError instanceof ApiError && apiError.status === 404) {
        onConfirm(content);
        onOpenChange(false);
        return;
      }

      feedback("erro");
      setError(
        apiError instanceof ApiError
          ? apiError.detail
          : "Não foi possível excluir o conteúdo. Tente novamente.",
      );
    } finally {
      setIsDeleting(false);
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
              <Modal.Heading>Excluir {content.title}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-2">
              <p className="text-muted">
                {isOwnerModerating
                  ? `Este conteúdo é de @${content.authorUsername}. Como dono da turma, você pode removê-lo. `
                  : ""}
                O item sai da pasta para todos os membros. Esta ação não pode ser
                desfeita.
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
                isDisabled={isDeleting}
              >
                Excluir
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
