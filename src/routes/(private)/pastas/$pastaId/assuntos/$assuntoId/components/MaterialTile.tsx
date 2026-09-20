import type { Content } from "@/types/api/content";
import { useContentThumbnail } from "@/hooks/useContentThumbnail";
import { describeStatus, effectiveStatus } from "@/utils/mediaStatus";
import { formatTimestamp } from "@/utils/mediaTime";
import { Button } from "@heroui/react";
import { cn } from "@heroui/styles";
import { AudioLines, FileText, Loader2, TriangleAlert } from "lucide-react";

interface MaterialTileProps {
  content: Content;
  onOpen: () => void;
}

const kindPhrase = {
  PDF: "o PDF",
  IMAGE: "a imagem",
  AUDIO: "o áudio",
} as const;

export function MaterialTile({ content, onOpen }: MaterialTileProps) {
  const { name, contentType, processingError, durationSeconds } = content;
  const { isImage, imageSrc, markImageFailed } = useContentThumbnail(content);
  const isAudio = contentType === "AUDIO";
  const status = effectiveStatus(content);
  const { label, showError } = describeStatus(status, processingError);
  // O selo só aparece enquanto há algo a dizer: em andamento ou falhou.
  const showBadge = status !== "COMPLETED";

  return (
    <Button
      className={cn(
        "aspect-square h-auto p-0 rounded-xl overflow-hidden relative",
        "bg-surface text-foreground shadow-surface",
      )}
      fullWidth
      aria-label={[
        `Abrir ${kindPhrase[contentType]} ${name}`,
        status === "COMPLETED" ? null : label.toLowerCase(),
        status === "FAILED" && showError ? processingError : null,
        isAudio && durationSeconds != null
          ? `duração ${formatTimestamp(durationSeconds)}`
          : null,
      ]
        .filter(Boolean)
        .join(", ")}
      onPress={onOpen}
    >
      {isImage && imageSrc ? (
        <>
          <img
            src={imageSrc}
            alt=""
            aria-hidden
            className="absolute inset-0 size-full object-cover"
            onError={markImageFailed}
          />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-4 text-left text-xs font-medium leading-snug text-white line-clamp-2 whitespace-normal break-all">
            {name}
          </span>
        </>
      ) : (
        <span className="size-full flex flex-col items-center justify-center gap-1.5 p-3 text-center">
          {isAudio ? (
            <AudioLines className="size-7 text-accent shrink-0" aria-hidden />
          ) : (
            <FileText className="size-7 text-accent shrink-0" aria-hidden />
          )}

          <span className="text-xs font-medium leading-snug line-clamp-2 whitespace-normal break-all">
            {name}
          </span>

          {isAudio && durationSeconds != null && status === "COMPLETED" ? (
            <span className="text-muted text-[10px] tabular-nums">
              {formatTimestamp(durationSeconds)}
            </span>
          ) : null}
        </span>
      )}

      {showBadge ? (
        <span
          className={cn(
            "absolute top-2 right-2 flex items-center gap-1 rounded-full px-2 py-1 text-[10px] text-white",
            status === "FAILED" ? "bg-danger" : "bg-black/60",
          )}
        >
          {status === "FAILED" ? (
            <TriangleAlert className="size-3" aria-hidden />
          ) : (
            <Loader2 className="size-3 animate-spin" aria-hidden />
          )}
          {label}
        </span>
      ) : null}
    </Button>
  );
}
