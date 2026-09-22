import { useMemo } from "react";
import { useParams } from "react-router";

import { personalMediaSource } from "@/api/mediaSource";
import { MediaMaterialView } from "@/components/media/MediaMaterialView";
import { pageMeta } from "@/utils/pageMeta";

export function meta() {
  return pageMeta({
    title: "Áudio ou vídeo",
    description:
      "Resumo, momentos-chave e transcrição do áudio ou vídeo, com o player para voltar ao ponto certo.",
  });
}

/** O áudio ou vídeo do próprio usuário; a tela é a mesma da turma (`MediaMaterialView`). */
export default function MediaMaterialPage() {
  const { pastaId, assuntoId, contentId } = useParams<
    "pastaId" | "assuntoId" | "contentId"
  >() as { pastaId: string; assuntoId: string; contentId: string };
  const source = useMemo(() => personalMediaSource(contentId), [contentId]);

  return (
    <MediaMaterialView
      source={source}
      backHref={`/pastas/${pastaId}/assuntos/${assuntoId}`}
    />
  );
}
