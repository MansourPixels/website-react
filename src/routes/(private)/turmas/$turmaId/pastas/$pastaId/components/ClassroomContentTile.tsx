import { Button, ButtonGroup, Popover } from "@heroui/react";
import {
  ClipboardList,
  Copy,
  Ellipsis,
  FileText,
  FileType,
  Download,
  Headphones,
  Video,
  Image as ImageIcon,
  Layers,
  Network,
  PencilLine,
  Trash,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { getClassroomContentProcessing, getClassroomDownloadUrl } from "@/api/classrooms";
import { ApiError } from "@/api/client";
import { MaterialViewer } from "@/components/MaterialViewer";
import type {
  ClassroomContent,
  ClassroomContentKind,
  ClassroomRole,
} from "@/types/api/classroom";
import { canDeleteContent, canEditContent } from "@/utils/classroomPermissions";
import { MEDIA_POLL_LIMIT_MS, nextPollDelay } from "@/utils/mediaStatus";
import { profilePath } from "@/utils/profile";
import type { ViewableFile } from "@/types/capture";

import { DialogContentExclusion } from "./DialogContentExclusion";
import { DialogFormContent } from "./DialogFormContent";
import { ClassroomSnapshotViewer } from "./ClassroomSnapshotViewer";

// Categoria não é status: verde, laranja e o accent têm significado próprio no
// sistema e não são etiqueta de tipo de material. Quem distingue é o ícone.
const kindMeta: Record<
  ClassroomContentKind,
  { icon: LucideIcon; label: string }
> = {
  flashcards: { icon: Layers, label: "Flash cards" },
  summary: { icon: FileText, label: "Resumo" },
  quiz: { icon: ClipboardList, label: "Simulado" },
  mindmap: { icon: Network, label: "Mapa mental" },
  snapshot: { icon: Copy, label: "Cópia da pasta" },
  pdf: { icon: FileType, label: "PDF" },
  image: { icon: ImageIcon, label: "Imagem" },
  audio: { icon: Headphones, label: "Áudio" },
  video: { icon: Video, label: "Vídeo" },
};

function formatFileSize(bytes: number): string {
  const megabytes = bytes / 1_048_576;

  if (megabytes >= 1) return `${megabytes.toFixed(1).replace(".", ",")} MB`;

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

interface ClassroomContentTileProps {
  classroomId: string;
  folderId: string;
  content: ClassroomContent;
  role: ClassroomRole;
  currentUserId: string;
  onChange: (content: ClassroomContent) => void;
  onDelete: (content: ClassroomContent) => void;
}

export function ClassroomContentTile({
  classroomId,
  folderId,
  content,
  role,
  currentUserId,
  onChange,
  onDelete,
}: ClassroomContentTileProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [material, setMaterial] = useState<ViewableFile | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [snapshotContentId, setSnapshotContentId] = useState<string | null>(null);

  const canEdit = canEditContent(role, content, currentUserId);
  const canDelete = canDeleteContent(role, content, currentUserId);
  // Áudio e vídeo são transcritos pela mesma fila e mostram os mesmos textos de andamento.
  const isAudio = content.kind === "audio" || content.kind === "video";
  const mediaWord = content.kind === "video" ? "vídeo" : "áudio";
  const isFile = content.kind === "pdf" || content.kind === "image" || isAudio;
  const isSnapshot = content.kind === "snapshot";
  const meta = kindMeta[content.kind];
  const Icon = meta.icon;
  const description = content.description ?? "";

  useEffect(() => {
    if (!isFile) return;

    const controller = new AbortController();
    const startedAt = Date.now();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;

    const load = () => {
      getClassroomContentProcessing(classroomId, folderId, content.id, controller.signal)
        .then((result) => {
          setStatus(result.status);
          setProcessingError(result.error ?? null);

          // PDF e imagem levam segundos e já eram consultados uma vez; uma
          // transcrição leva minutos, então o áudio acompanha até terminar.
          const inProgress = result.status === "pending" || result.status === "processing";

          if (isAudio && inProgress && Date.now() - startedAt < MEDIA_POLL_LIMIT_MS) {
            timeoutId = setTimeout(load, nextPollDelay(attempt));
            attempt += 1;
          }
        })
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === "AbortError")) setStatus(null);
        });
    };

    load();

    return () => {
      controller.abort();
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [classroomId, content.id, folderId, isAudio, isFile]);

  async function requestFile(open: boolean) {
    setActionError(null);
    try {
      const { url } = await getClassroomDownloadUrl(classroomId, folderId, content.id);
      if (open) {
        setMaterial({ name: content.fileName || content.title, url, contentType: content.kind === "pdf" ? "PDF" : content.kind === "audio" ? "AUDIO" : content.kind === "video" ? "VIDEO" : "IMAGE" });
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      setActionError(error instanceof ApiError ? error.detail : "Não foi possível acessar o arquivo. Tente novamente.");
    }
  }

  return (
    <article className="bg-surface shadow-surface flex h-full flex-col gap-3 rounded-2xl p-4">
      <header className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="bg-default text-muted flex size-9 shrink-0 items-center justify-center rounded-xl"
        >
          <Icon className="size-5" />
        </span>

        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-muted text-xs">{meta.label}</span>
          <h3 className="line-clamp-2 font-semibold text-balance">
            {content.title}
          </h3>
        </div>

        {canEdit || canDelete ? (
          <Popover>
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              aria-label={`Opções de ${content.title}`}
            >
              <Ellipsis className="size-4" />
            </Button>
            <Popover.Content>
              <Popover.Dialog className="p-0">
                <ButtonGroup orientation="vertical" className="w-44">
                  {canEdit ? (
                    <Button
                      variant="ghost"
                      className="justify-start border-b"
                      onPress={() => setIsEditOpen(true)}
                    >
                      <PencilLine className="size-4" />
                      Editar
                    </Button>
                  ) : null}
                  {canDelete ? (
                    <Button
                      variant="ghost"
                      className="text-danger justify-start"
                      onPress={() => setIsDeleteOpen(true)}
                    >
                      <Trash className="size-4" />
                      Excluir
                    </Button>
                  ) : null}
                </ButtonGroup>
              </Popover.Dialog>
            </Popover.Content>
          </Popover>
        ) : null}
      </header>

      {description.length > 0 ? (
        <p className="text-muted line-clamp-3 text-sm text-pretty">
          {description}
        </p>
      ) : null}

      <footer className="text-muted mt-auto flex flex-wrap items-center gap-x-2 text-xs">
        <span>
          por{" "}
          <Link
            to={profilePath(content.author.username)}
            className="hover:underline"
          >
            @{content.author.username}
          </Link>
        </span>
        <span aria-hidden="true">·</span>
        <span>
          {new Date(content.createdAt).toLocaleDateString("pt-BR", {
            day: "numeric",
            month: "long",
          })}
        </span>
        {content.fileSize !== null ? (
          <>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {formatFileSize(content.fileSize)}
            </span>
          </>
        ) : null}
      </footer>

      {isFile && status !== null ? (
        <p role="status" className="text-muted text-xs">
          {status === "completed"
            ? isAudio ? "Transcrição pronta" : "Texto extraído"
            : status === "failed"
              ? isAudio
                ? `Falha ao transcrever${processingError ? `: ${processingError}` : "."} O ${mediaWord} continua disponível.`
                : "Falha ao extrair texto. O download continua disponível."
              : isAudio ? `Transcrevendo o ${mediaWord}…` : "Processando texto…"}
        </p>
      ) : null}
      {isFile ? (
        <div className="grid grid-cols-2 gap-2">
          <Button className="min-h-11" variant="secondary" onPress={() => requestFile(true)}>Abrir</Button>
          <Button className="min-h-11" variant="secondary" onPress={() => requestFile(false)}><Download className="size-4" />Baixar</Button>
        </div>
      ) : null}
      {isSnapshot ? <Button className="min-h-11" variant="secondary" onPress={() => setSnapshotContentId(content.id)}>Abrir cópia</Button> : null}
      {actionError !== null ? <p role="alert" className="text-danger text-sm">{actionError}</p> : null}

      <DialogFormContent
        classroomId={classroomId}
        folderId={folderId}
        content={content}
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSubmit={onChange}
      />
      <DialogContentExclusion
        classroomId={classroomId}
        folderId={folderId}
        content={content}
        isOwnerModerating={role === "owner" && content.author.id !== currentUserId}
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={onDelete}
      />
      {isFile ? (
        <MaterialViewer
          material={material}
          onClose={() => setMaterial(null)}
          classroomContent={{ classroomId, folderId, contentId: content.id }}
          onContentUnavailable={() => {
            setMaterial(null);
            setActionError("Este conteúdo foi removido ou não está mais disponível.");
          }}
        />
      ) : null}
      {isSnapshot ? <ClassroomSnapshotViewer classroomId={classroomId} folderId={folderId} contentId={snapshotContentId} onClose={() => setSnapshotContentId(null)} /> : null}
    </article>
  );
}
