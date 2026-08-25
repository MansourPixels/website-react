import type { Material } from "@/types/Material";
import { Button } from "@heroui/react";
import { FilePlus, ImagePlus } from "lucide-react";

import { MaterialViewer } from "./MaterialViewer";

interface PhotoReviewProps {
  material: Material;
  onBack: () => void;
  onSelect: () => void;
}

export function PhotoReview({ material, onBack, onSelect }: PhotoReviewProps) {
  const isPdf = material.kind === "pdf";

  return (
    <MaterialViewer
      material={material}
      onClose={onBack}
      footer={
        <Button fullWidth size="lg" onPress={onSelect}>
          {isPdf ? <FilePlus /> : <ImagePlus />}
          {isPdf ? "Selecionar PDF" : "Selecionar imagem"}
        </Button>
      }
    />
  );
}
