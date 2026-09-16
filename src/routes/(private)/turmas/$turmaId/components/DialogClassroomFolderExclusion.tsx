import { Button, Modal } from "@heroui/react";
import { Trash } from "lucide-react";
import { useEffect, useState } from "react";

import { deleteFolder } from "@/api/classrooms";
import { ApiError } from "@/api/client";
import { useFeedback } from "@/hooks/useFeedback";
import type { ClassroomFolder } from "@/types/api/classroom";

interface DialogClassroomFolderExclusionProps {
  folder: ClassroomFolder;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (folder: ClassroomFolder) => void;
}

export function DialogClassroomFolderExclusion({
  folder,
  isOpen,
  onOpenChange,
  onConfirm,
}: DialogClassroomFolderExclusionProps) {
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
      await deleteFolder(folder.classroomId, folder.id);

      feedback("exclusao");
      onConfirm(folder);
      onOpenChange(false);
    } catch (apiError) {
      // 404: a pasta já não existe (excluída por outra sessão) — some da lista
      // em vez de travar numa pasta fantasma.
      if (apiError instanceof ApiError && apiError.status === 404) {
        onConfirm(folder);
        onOpenChange(false);
        return;
      }

      feedback("erro");
      setError(
        apiError instanceof ApiError
          ? apiError.detail
          : "Não foi possível excluir a pasta. Tente novamente.",
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
              <Modal.Heading>Excluir pasta {folder.name}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-2">
              <p className="text-muted">
                {folder.contentCount > 0 ? (
                  <>
                    Esta pasta tem{" "}
                    <span className="tabular-nums">{folder.contentCount}</span>{" "}
                    {folder.contentCount === 1 ? "item" : "itens"} que também
                    serão excluídos para toda a turma.{" "}
                  </>
                ) : null}
                Esta ação não pode ser desfeita.
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
                Excluir pasta
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
