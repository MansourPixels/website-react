import { useContentThumbnail } from "@/hooks/useContentThumbnail";
import type { Content } from "@/types/api/content";
import { AudioLines, FileText } from "lucide-react";

interface ContentPreviewThumbProps {
  content: Content;
}

export function ContentPreviewThumb({ content }: ContentPreviewThumbProps) {
  const { isImage, imageSrc, markImageFailed } = useContentThumbnail(content);

  return (
    <div className="aspect-video rounded-md overflow-hidden bg-accent-soft flex items-center justify-center">
      {isImage && imageSrc ? (
        <img
          src={imageSrc}
          alt=""
          aria-hidden
          className="size-full object-cover"
          onError={markImageFailed}
        />
      ) : content.contentType === "AUDIO" ? (
        <AudioLines className="size-4 text-accent shrink-0" aria-hidden />
      ) : (
        <FileText className="size-4 text-accent shrink-0" aria-hidden />
      )}
    </div>
  );
}
