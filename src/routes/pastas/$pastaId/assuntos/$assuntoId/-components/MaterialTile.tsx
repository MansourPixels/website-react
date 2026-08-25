import type { Material } from "@/types/Material";
import { formatFileSize } from "@/utils/materials";
import { formatUploadDate } from "@/utils/time";
import { Button } from "@heroui/react";
import { cn } from "@heroui/styles";
import { FileText } from "lucide-react";

interface MaterialTileProps {
  material: Material;
  onOpen: () => void;
}

export function MaterialTile({ material, onOpen }: MaterialTileProps) {
  const { kind, name, pages, size, uploadedAt, url } = material;

  if (kind !== "pdf") {
    return (
      <Button
        className="aspect-square h-auto p-0 rounded-xl overflow-hidden"
        fullWidth
        aria-label={`Abrir ${name}`}
        onPress={onOpen}
      >
        <img src={url} alt="" className="size-full object-cover" />
      </Button>
    );
  }

  const details = [
    size === undefined ? null : formatFileSize(size),
    pages === undefined ? null : `${pages} ${pages === 1 ? "página" : "páginas"}`,
  ].filter((detail) => detail !== null);

  const uploadedLabel = uploadedAt ? formatUploadDate(uploadedAt) : "";

  return (
    <Button
      className={cn(
        "aspect-square h-auto p-0 rounded-xl overflow-hidden",
        "bg-white shadow-surface",
      )}
      fullWidth
      aria-label={[
        `Abrir o PDF ${name}`,
        details.join(", "),
        uploadedLabel && `enviado ${uploadedLabel}`,
      ]
        .filter(Boolean)
        .join(", ")}
      onPress={onOpen}
    >
      <span className="size-full flex flex-col items-center justify-center gap-1.5 p-3 text-center">
        <FileText className="size-7 text-accent shrink-0" aria-hidden />

        <span className="text-xs font-medium leading-snug line-clamp-2 whitespace-normal break-all">
          {name}
        </span>

        {details.length > 0 ? (
          <span className="text-xs text-muted leading-tight tabular-nums">
            {details.join(" · ")}
          </span>
        ) : null}

        {uploadedLabel ? (
          <span className="text-xs text-muted leading-tight tabular-nums">
            {uploadedLabel}
          </span>
        ) : null}
      </span>
    </Button>
  );
}
