import type { Folder } from "@/types/Folder";
import { Button, ButtonGroup, Popover } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import { Ellipsis, Pencil, Trash } from "lucide-react";
import { useState } from "react";
import { DialogFolderExclusion } from "./DialogFolderExclusion";
import { DialogFormFolder } from "./DialogFormFolder";

interface FolderProps {
  folder: Folder;
  onChangeFolder: (folder: Folder) => void;
  onDeleteFolder: (folder: Folder) => void;
}

export function FolderCard({
  folder,
  onChangeFolder,
  onDeleteFolder,
}: FolderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  function openDialog(open: (isOpen: boolean) => void) {
    setIsMenuOpen(false);
    open(true);
  }

  return (
    <article className="relative group hover:brightness-105">
      <Link
        to="/pastas/$pastaId"
        params={{ pastaId: folder.id }}
        className="block active:scale-98 transition-all bg-(--folder-color) relative w-full rounded-3xl after:content-[''] after:bg-[url('/detalhe-pasta.svg')] after:bg-no-repeat after:bg-top-right after:w-full after:h-full after:inset-0 after:flex after:absolute group-hover:after:brightness-95"
        style={{ "--folder-color": folder.color } as React.CSSProperties}
      >
        <div className="relative flex overflow-hidden h-20">
          {Array.from({ length: Math.min(folder.amount, 4) }).map(
            (_, index) => (
              <div className="preview" key={`${folder.id}-preview-${index}`}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            ),
          )}
        </div>
        <div className="relative flex flex-col justify-center h-20 bg-black/15 px-4 py-1 rounded-b-3xl text-white">
          <h2 className="text-2xl font-semibold">{folder.name}</h2>
          <span className="opacity-75">{folder.amount || 0}</span>
        </div>
      </Link>

      <Popover isOpen={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <Button
          variant="ghost"
          isIconOnly
          aria-label={`Opções da pasta ${folder.name}`}
          className="absolute bottom-9 right-2 size-10 text-white hover:bg-white/10 active:bg-white/20 data-[pressed=true]:bg-white/20"
        >
          <Ellipsis />
        </Button>
        <Popover.Content
          className="max-w-64 rounded-xl z-10!"
          placement="bottom end"
        >
          <Popover.Dialog className="p-2">
            <ButtonGroup orientation="vertical">
              <Button
                variant="ghost"
                className="w-full justify-start rounded-t-lg border-b text-accent-soft-foreground"
                onPress={() => openDialog(setIsEditOpen)}
              >
                <Pencil /> Editar pasta
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start rounded-b-lg text-danger"
                onPress={() => openDialog(setIsDeleteOpen)}
              >
                <Trash /> Excluir pasta
              </Button>
            </ButtonGroup>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>

      <DialogFormFolder
        variant="edit"
        folder={folder}
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSubmit={onChangeFolder}
      />
      <DialogFolderExclusion
        folder={folder}
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={onDeleteFolder}
      />
    </article>
  );
}
