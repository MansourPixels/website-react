import type { Folder } from "@/types/Folder";
import { cn } from "@heroui/styles";

interface FolderCoverProps {
  folder: Folder;
  titleAs?: "h2" | "p";
  className?: string;
}

export function FolderCover({
  folder,
  titleAs: Title = "h2",
  className,
}: FolderCoverProps) {
  return (
    <div
      className={cn(
        "bg-(--folder-color) relative w-full rounded-3xl after:content-[''] after:bg-[url('/detalhe-pasta.svg')] after:bg-no-repeat after:bg-top-right after:w-full after:h-full after:inset-0 after:flex after:absolute group-hover:after:brightness-95",
        className,
      )}
      style={{ "--folder-color": folder.color } as React.CSSProperties}
    >
      <div className="relative flex overflow-hidden h-20">
        {Array.from({ length: Math.min(folder.amount, 4) }).map((_, index) => (
          <div
            className="preview md:nth-of-type-[4]:hidden"
            key={`${folder.id}-preview-${index}`}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>
        ))}
      </div>
      <div className="relative flex flex-col justify-center h-20 bg-black/15 px-4 py-1 rounded-b-3xl text-white">
        <Title className="text-2xl font-semibold">{folder.name}</Title>
        <span className="opacity-75 tabular-nums">{folder.amount || 0}</span>
      </div>
    </div>
  );
}
