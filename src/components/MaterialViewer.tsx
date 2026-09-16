import type { ViewableFile } from "@/types/capture";
import { pickImageForSeed } from "@/utils/imageFallback";
import { Button, Modal } from "@heroui/react";

import { OcrSheet } from "./OcrSheet";
import { ChevronLeft, ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

interface MaterialViewerProps {
  material: ViewableFile | null;
  onClose: () => void;
  footer?: ReactNode;
  /**
   * Quando presente, mostra o painel com o texto que o OCR extraiu.
   * Fica opcional porque `PhotoReview` abre este visualizador com um arquivo
   * local, antes do upload — não existe conteúdo no servidor para consultar.
   */
  contentId?: string;
  classroomContent?: { classroomId: string; folderId: string; contentId: string };
  onContentUnavailable?: () => void;
}

export function MaterialViewer({
  material,
  onClose,
  footer,
  contentId,
  classroomContent,
  onContentUnavailable,
}: MaterialViewerProps) {
  const isPdf = material?.contentType === "PDF";
  // Guardar a própria URL (em vez de um boolean) evita precisar de um efeito
  // para "resetar" o erro quando o material muda: a comparação já não bate.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  // Imagem que falha cai num placeholder de acervo, e não num estado de erro:
  // decisão do usuário, para a demonstração não exibir imagem quebrada. O
  // `alt` continua sendo o nome do material.
  const imageSrc =
    material &&
    (material.url === failedUrl ? pickImageForSeed(material.name) : material.url);

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
            className="relative bg-black/80"
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
                  className="size-full min-h-0 rounded-2xl bg-surface"
                />
              ) : (
                <img
                  src={imageSrc || undefined}
                  alt={material.name}
                  className="max-h-full max-w-full object-contain"
                  onError={() => setFailedUrl(material.url)}
                />
              )}
            </Modal.Body>

            {(contentId !== undefined || classroomContent !== undefined) && material !== null ? (
              <OcrSheet
                contentId={classroomContent?.contentId ?? contentId!}
                classroomContent={classroomContent}
                onContentUnavailable={onContentUnavailable}
              />
            ) : null}

            {footer ? <Modal.Footer>{footer}</Modal.Footer> : null}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
