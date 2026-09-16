import { Button, ButtonGroup, Popover } from "@heroui/react";
import {
  ClipboardList,
  Ellipsis,
  FileText,
  FileType,
  Image as ImageIcon,
  Layers,
  Network,
  PencilLine,
  Trash,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import type {
  ClassroomContent,
  ClassroomContentKind,
  ClassroomRole,
} from "@/types/api/classroom";
import { canDeleteContent, canEditContent } from "@/utils/classroomPermissions";
import { profilePath } from "@/utils/profile";

import { DialogContentExclusion } from "./DialogContentExclusion";
import { DialogFormContent } from "./DialogFormContent";

// Categoria não é status: verde, laranja e o accent têm significado próprio no
// sistema e não são etiqueta de tipo de material. Quem distingue é o ícone.
const kindMeta: Record<ClassroomContentKind, { icon: LucideIcon; label: string }> =
  {
    flashcards: { icon: Layers, label: "Flash cards" },
    summary: { icon: FileText, label: "Resumo" },
    quiz: { icon: ClipboardList, label: "Simulado" },
    mindmap: { icon: Network, label: "Mapa mental" },
    pdf: { icon: FileType, label: "PDF" },
    image: { icon: ImageIcon, label: "Imagem" },
  };

function formatFileSize(bytes: number): string {
  const megabytes = bytes / 1_048_576;

  if (megabytes >= 1) return `${megabytes.toFixed(1).replace(".", ",")} MB`;

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

interface ClassroomContentTileProps {
  content: ClassroomContent;
  role: ClassroomRole;
  currentUserId: string;
  onChange: (content: ClassroomContent) => void;
  onDelete: (content: ClassroomContent) => void;
}

export function ClassroomContentTile({
  content,
  role,
  currentUserId,
  onChange,
  onDelete,
}: ClassroomContentTileProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const canEdit = canEditContent(role, content, currentUserId);
  const canDelete = canDeleteContent(role, content, currentUserId);
  const meta = kindMeta[content.kind];
  const Icon = meta.icon;

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

      {content.description.length > 0 ? (
        <p className="text-muted line-clamp-3 text-sm text-pretty">
          {content.description}
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

      <DialogFormContent
        content={content}
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSubmit={onChange}
      />
      <DialogContentExclusion
        content={content}
        isOwnerModerating={role === "owner" && content.author.id !== currentUserId}
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={onDelete}
      />
    </article>
  );
}
