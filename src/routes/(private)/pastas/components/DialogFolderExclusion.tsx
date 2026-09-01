import { Button, Modal } from "@heroui/react";
import { Trash } from "lucide-react";
import { useEffect, useState } from "react";

import { deleteMotherFolder } from "@/api/folders";
import { useFeedback } from "@/hooks/useFeedback";
import { ApiError } from "@/api/client";
import type { MotherFolder } from "@/types/api/folder";

interface DialogFolderExclusionProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (folder: MotherFolder) => void;
  folder: MotherFolder;
}

export function DialogFolderExclusion({
  isOpen,
  onOpenChange,
  onConfirm,
  folder,
}: DialogFolderExclusionProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // O diálogo fica montado entre aberturas (só isOpen muda) — reseta o erro
  // de uma tentativa anterior sempre que reabre, não só ao fechar.
  useEffect(() => {
    if (isOpen) setError(null);
  }, [isOpen]);

  const feedback = useFeedback();

  async function handleConfirm() {
    if (isDeleting) return;

    setIsDeleting(true);
    setError(null);

    try {
      await deleteMotherFolder(folder.id);

      feedback("exclusao");
      onConfirm(folder);
      onOpenChange(false);
    } catch (apiError) {
      // 404: a pasta já não existe (excluída em outra sessão) — remove da
      // lista local em vez de travar a UI numa pasta fantasma.
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
                {folder.amount > 0
                  ? `Esta pasta possui ${folder.amount} ${folder.amount === 1 ? "item" : "itens"} que também serão excluídos. `
                  : ""}
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
