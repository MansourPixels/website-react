import { Button, Modal } from "@heroui/react";
import { Trash } from "lucide-react";
import { useEffect, useState } from "react";

import { deleteChildFolder } from "@/api/folders";
import { ApiError } from "@/api/client";
import type { ChildFolder } from "@/types/api/folder";

interface DialogSubjectExclusionProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (subject: ChildFolder) => void;
  subject: ChildFolder;
}

export function DialogSubjectExclusion({
  isOpen,
  onOpenChange,
  onConfirm,
  subject,
}: DialogSubjectExclusionProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // O diálogo fica montado entre aberturas (só isOpen muda) — reseta o erro
  // de uma tentativa anterior sempre que reabre, não só ao fechar.
  useEffect(() => {
    if (isOpen) setError(null);
  }, [isOpen]);

  async function handleConfirm() {
    if (isDeleting) return;

    setIsDeleting(true);
    setError(null);

    try {
      await deleteChildFolder(subject.id);
      onConfirm(subject);
      onOpenChange(false);
    } catch (apiError) {
      // 404: o assunto já não existe (excluído em outra sessão) — remove da
      // lista local em vez de travar a UI num assunto fantasma.
      if (apiError instanceof ApiError && apiError.status === 404) {
        onConfirm(subject);
        onOpenChange(false);
        return;
      }

      setError(
        apiError instanceof ApiError
          ? apiError.detail
          : "Não foi possível excluir o assunto. Tente novamente.",
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
              <Modal.Heading>Excluir {subject.name}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-2">
              <p className="text-muted">
                Os flash cards, resumos e simulados gerados a partir deste
                assunto também serão excluídos. Esta ação não pode ser desfeita.
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
                Excluir assunto
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
