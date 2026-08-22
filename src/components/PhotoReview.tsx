import { Button } from "@heroui/react";
import { ImagePlus } from "lucide-react";

import { ImageViewer } from "./ImageViewer";

interface PhotoReviewProps {
  image: string;
  onBack: () => void;
  onSelect: () => void;
}

export function PhotoReview({ image, onBack, onSelect }: PhotoReviewProps) {
  return (
    <ImageViewer
      image={image}
      onClose={onBack}
      footer={
        <Button fullWidth size="lg" onPress={onSelect}>
          <ImagePlus />
          Selecionar imagem
        </Button>
      }
    />
  );
}
