import { Button, Modal } from "@heroui/react";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

interface ImageViewerProps {
  image: string | null;
  onClose: () => void;
  footer?: ReactNode;
}

export function ImageViewer({ image, onClose, footer }: ImageViewerProps) {
  return (
    <Modal
      isOpen={Boolean(image)}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <Modal.Backdrop>
        <Modal.Container size="full">
          <Modal.Dialog
            aria-label="Visualização da imagem"
            className="bg-black/80"
          >
            <Modal.Header className="items-start">
              <Button
                isIconOnly
                aria-label="Voltar"
                size="lg"
                className="bg-black/35 text-white"
                onPress={onClose}
              >
                <ChevronLeft className="size-6" />
              </Button>
            </Modal.Header>

            <Modal.Body
              className="flex items-center justify-center"
              onClick={(event) => {
                if (event.target === event.currentTarget) onClose();
              }}
            >
              {image ? (
                <img
                  src={image}
                  alt="Imagem em tela cheia"
                  className="max-h-full max-w-full object-contain"
                />
              ) : null}
            </Modal.Body>

            {footer ? <Modal.Footer>{footer}</Modal.Footer> : null}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
