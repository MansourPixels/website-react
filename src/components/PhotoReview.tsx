import type { CapturedFile } from "@/types/capture";
import { Button } from "@heroui/react";
import { FilePlus, ImagePlus } from "lucide-react";

import { MaterialViewer } from "./MaterialViewer";

interface PhotoReviewProps {
  material: CapturedFile;
  onBack: () => void;
  onSelect: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export function PhotoReview({
  material,
  onBack,
  onSelect,
  isSubmitting = false,
  error = null,
}: PhotoReviewProps) {
  const isPdf = material.contentType === "PDF";

  return (
    <MaterialViewer
      material={material}
      onClose={onBack}
      footer={
        <div className="flex w-full flex-col gap-2">
          {error !== null ? (
            <p
              role="alert"
              className="text-danger text-center text-sm text-pretty"
            >
              {error}
            </p>
          ) : null}
          <Button
            fullWidth
            size="lg"
            onPress={onSelect}
            isDisabled={isSubmitting}
          >
            {isPdf ? <FilePlus /> : <ImagePlus />}
            {isSubmitting
              ? "Enviando..."
              : isPdf
                ? "Selecionar PDF"
                : "Selecionar imagem"}
          </Button>
        </div>
      }
    />
  );
}
