import { Button, Modal } from "@heroui/react";
import { Trash } from "lucide-react";
import type { Folder } from "../../types/Folder";

interface DialogFolderExclusionProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (folder: Folder) => void;
  folder: Folder;
}

export function DialogFolderExclusion({
  isOpen,
  onOpenChange,
  onConfirm,
  folder,
}: DialogFolderExclusionProps) {
  function handleConfirm() {
    onConfirm(folder);
    onOpenChange(false);
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
            <Modal.Body>
              <p className="text-muted">
                {folder.amount > 0
                  ? `Esta pasta possui ${folder.amount} ${folder.amount === 1 ? "item" : "itens"} que também serão excluídos. `
                  : ""}
                Esta ação não pode ser desfeita.
              </p>
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
