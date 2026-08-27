import { getDownloadUrl } from "@/api/content";
import type { Content } from "@/types/api/content";
import { pickImageForSeed } from "@/utils/imageFallback";
import { Button } from "@heroui/react";
import { cn } from "@heroui/styles";
import { FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface MaterialTileProps {
  content: Content;
  onOpen: () => void;
}

export function MaterialTile({ content, onOpen }: MaterialTileProps) {
  const { id, name, contentType, hasSummary } = content;
  const isPdf = contentType === "PDF";
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (isPdf) return;

    let cancelled = false;

    getDownloadUrl(id)
      .then(({ url }) => {
        if (!cancelled) setThumbnailUrl(url);
      })
      .catch(() => {
        if (!cancelled) setImageFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [id, isPdf]);

  const imageSrc = imageFailed ? pickImageForSeed(id) : thumbnailUrl;

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
      {!isPdf && imageSrc ? (
        <>
          <img
            src={imageSrc}
            alt=""
            aria-hidden
            className="absolute inset-0 size-full object-cover"
            onError={() => setImageFailed(true)}
          />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-4 text-left text-xs font-medium leading-snug text-white line-clamp-2 whitespace-normal break-all">
            {name}
          </span>
        </>
      ) : (
        <span className="size-full flex flex-col items-center justify-center gap-1.5 p-3 text-center">
          <FileText className="size-7 text-accent shrink-0" aria-hidden />

          <span className="text-xs font-medium leading-snug line-clamp-2 whitespace-normal break-all">
            {name}
          </span>
        </span>
      )}

      {!hasSummary ? (
        <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] text-white">
          <Loader2 className="size-3 animate-spin" />
          Processando
        </span>
      ) : null}
    </Button>
  );
}
