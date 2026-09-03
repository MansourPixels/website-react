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
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const canManage = canManageFolders(role);

  return (
    <article className="group relative">
      <Link to={`/turmas/${folder.classroomId}/pastas/${folder.id}`}>
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
        <div className="absolute top-2 right-2">
          <Popover>
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              aria-label={`Opções da pasta ${folder.name}`}
              className="text-white"
            >
              <Ellipsis className="size-4" />
            </Button>
            <Popover.Content>
              <Popover.Dialog className="p-0">
                <ButtonGroup orientation="vertical" className="w-44">
                  <Button
                    variant="ghost"
                    className="justify-start border-b"
                    onPress={() => setIsEditOpen(true)}
                  >
                    <FolderPen className="size-4" />
                    Editar pasta
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-danger justify-start"
                    onPress={() => setIsDeleteOpen(true)}
                  >
                    <Trash className="size-4" />
                    Excluir pasta
                  </Button>
                </ButtonGroup>
              </Popover.Dialog>
            </Popover.Content>
          </Popover>
        </div>
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
