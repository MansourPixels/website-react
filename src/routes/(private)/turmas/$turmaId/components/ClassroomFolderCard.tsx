import { Button, ButtonGroup, Popover } from "@heroui/react";
import { Ellipsis, FolderPen, Trash } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { FolderCover } from "@/components/FolderCover";
import type { ClassroomFolder, ClassroomRole } from "@/types/api/classroom";
import { canManageFolders } from "@/utils/classroomPermissions";

import { DialogClassroomFolderExclusion } from "./DialogClassroomFolderExclusion";
import { DialogFormClassroomFolder } from "./DialogFormClassroomFolder";

interface ClassroomFolderCardProps {
  folder: ClassroomFolder;
  role: ClassroomRole;
  onChange: (folder: ClassroomFolder) => void;
  onDelete: (folder: ClassroomFolder) => void;
}

export function ClassroomFolderCard({
  folder,
  role,
  onChange,
  onDelete,
}: ClassroomFolderCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const canManage = canManageFolders(role);

  // O popover precisa fechar antes do modal abrir: dois overlays empilhados
  // roubam o foco um do outro.
  function openDialog(open: (isOpen: boolean) => void) {
    setIsMenuOpen(false);
    open(true);
  }

  return (
    <article className="group relative hover:brightness-105">
      <Link
        to={`/turmas/${folder.classroomId}/pastas/${folder.id}`}
        className="block rounded-3xl transition-all active:scale-98 motion-reduce:transition-none"
      >
        {/* `FolderCover` fala a linguagem das pastas do Revi: reaproveitá-lo
            faz a pasta de turma parecer a mesma coisa, porque é. */}
        <FolderCover
          folder={{
            id: folder.id,
            name: folder.name,
            color: folder.color,
            amount: folder.contentCount,
          }}
        />
      </Link>

      {canManage ? (
        <Popover isOpen={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <Button
            isIconOnly
            variant="ghost"
            aria-label={`Opções da pasta ${folder.name}`}
            // Não dá para saber que cor está embaixo: o realce é branco
            // translúcido, como no cartão de pasta.
            className="absolute right-2 bottom-9 size-10 text-white hover:bg-white/10 active:bg-white/20 data-[pressed=true]:bg-white/20"
          >
            <Ellipsis className="size-4" />
          </Button>
          <Popover.Content className="z-10! max-w-64 rounded-xl" placement="bottom end">
            <Popover.Dialog className="p-0">
              <ButtonGroup orientation="vertical" className="w-44">
                <Button
                  variant="ghost"
                  className="justify-start border-b"
                  onPress={() => openDialog(setIsEditOpen)}
                >
                  <FolderPen className="size-4" />
                  Editar pasta
                </Button>
                <Button
                  variant="ghost"
                  className="text-danger justify-start"
                  onPress={() => openDialog(setIsDeleteOpen)}
                >
                  <Trash className="size-4" />
                  Excluir pasta
                </Button>
              </ButtonGroup>
            </Popover.Dialog>
          </Popover.Content>
        </Popover>
      ) : null}

      <DialogFormClassroomFolder
        variant="edit"
        classroomId={folder.classroomId}
        folder={folder}
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSubmit={onChange}
      />
      <DialogClassroomFolderExclusion
        folder={folder}
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={onDelete}
      />
    </article>
  );
}
