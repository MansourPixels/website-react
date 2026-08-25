import type { Material } from "@/types/Material";
import { Button, Modal } from "@heroui/react";
import { ChevronLeft, ExternalLink } from "lucide-react";
import type { ReactNode } from "react";

interface MaterialViewerProps {
  material: Material | null;
  onClose: () => void;
  footer?: ReactNode;
}

export function MaterialViewer({
  material,
  onClose,
  footer,
}: MaterialViewerProps) {
  const isPdf = material?.kind === "pdf";

  return (
    <Modal
      isOpen={Boolean(material)}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <Modal.Backdrop>
        <Modal.Container size="full">
          <Modal.Dialog
            aria-label={isPdf ? "Visualização do PDF" : "Visualização da imagem"}
            className="bg-black/80"
          >
            <Modal.Header className="items-start justify-between gap-3">
              <Button
                isIconOnly
                aria-label="Voltar"
                size="lg"
                className="bg-black/35 text-white"
                onPress={onClose}
              >
                <ChevronLeft className="size-6" />
              </Button>

              {isPdf && material ? (
                <Button
                  size="lg"
                  className="bg-black/35 text-white"
                  onPress={() => window.open(material.url, "_blank")}
                >
                  <ExternalLink className="size-5" />
                  Abrir em nova aba
                </Button>
              ) : null}
            </Modal.Header>

            <Modal.Body
              className="flex items-center justify-center min-h-0"
              onClick={(event) => {
                if (event.target === event.currentTarget) onClose();
              }}
            >
              {material === null ? null : isPdf ? (
                <iframe
                  src={material.url}
                  title={material.name}
                  className="size-full min-h-0 rounded-2xl bg-white"
                />
              ) : (
                <img
                  src={material.url}
                  alt={material.name}
                  className="max-h-full max-w-full object-contain"
                />
              )}
            </Modal.Body>

            {footer ? <Modal.Footer>{footer}</Modal.Footer> : null}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
