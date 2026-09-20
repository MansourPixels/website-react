import { getDownloadUrl } from "@/api/content";
import type { Content } from "@/types/api/content";
import { pickImageForSeed } from "@/utils/imageFallback";
import { useEffect, useState } from "react";

// Resolve a URL de preview de um Content de imagem, caindo para uma foto fixa
// (por seed do id) quando o download falha ou a própria imagem não carrega.
// PDF e áudio não têm miniatura: buscar a URL de um áudio como se fosse uma
// imagem baixaria o arquivo inteiro por nada.
export function useContentThumbnail(content: Content) {
  const { id, contentType } = content;
  const isImage = contentType === "IMAGE";
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (!isImage) return;

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
  }, [id, isImage]);

  return {
    isImage,
    imageSrc: imageFailed ? pickImageForSeed(id) : thumbnailUrl,
    markImageFailed: () => setImageFailed(true),
  };
}
