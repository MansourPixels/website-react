import type { Content } from "@/types/api/content";
import { Button } from "@heroui/react";
import { cn } from "@heroui/styles";
import { FileText, Image as ImageIcon, Loader2 } from "lucide-react";

interface MaterialTileProps {
  content: Content;
  onOpen: () => void;
}

export function MaterialTile({ content, onOpen }: MaterialTileProps) {
  const { name, contentType, hasSummary } = content;
  const isPdf = contentType === "PDF";

  return (
    <Button
      className={cn(
        "aspect-square h-auto p-0 rounded-xl overflow-hidden relative",
        "bg-white text-foreground shadow-surface",
      )}
      fullWidth
      aria-label={[
        `Abrir ${isPdf ? "o PDF" : "a imagem"} ${name}`,
        hasSummary ? null : "ainda processando",
      ]
        .filter(Boolean)
        .join(", ")}
      onPress={onOpen}
    >
      <span className="size-full flex flex-col items-center justify-center gap-1.5 p-3 text-center">
        {isPdf ? (
          <FileText className="size-7 text-accent shrink-0" aria-hidden />
        ) : (
          <ImageIcon className="size-7 text-accent shrink-0" aria-hidden />
        )}

        <span className="text-xs font-medium leading-snug line-clamp-2 whitespace-normal break-all">
          {name}
        </span>
      </span>

      {!hasSummary ? (
        <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] text-white">
          <Loader2 className="size-3 animate-spin" />
          Processando
        </span>
      ) : null}
    </Button>
  );
}
