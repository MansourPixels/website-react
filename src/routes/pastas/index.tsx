import { createFileRoute } from "@tanstack/react-router";

import { useState } from "react";
import { FABButton } from "@/components/FABButton";
import { NavMenu } from "@/components/NavMenu";
import { defaultFolders } from "@/mocks/folders";
import type { Folder as FolderType } from "@/types/Folder";
import { normalizeText } from "@/utils/text";
import { DialogFormFolder } from "./-components/DialogFormFolder";
import { FolderCard } from "./-components/FolderCard";

export const Route = createFileRoute("/pastas/")({
  component: FolderListPage,
});

function FolderListPage() {
  const [folders, setFolders] = useState<FolderType[]>(defaultFolders);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [search, setSearch] = useState("");

  const normalizedSearch = normalizeText(search);
  const filteredFolders = normalizedSearch
    ? folders.filter((folder) =>
        normalizeText(folder.name).includes(normalizedSearch),
      )
    : folders;

  function handleAddFolder(folder: FolderType) {
    setFolders((current) => [...current, folder]);
  }

  function handleChangeFolder(folder: FolderType) {
    setFolders((current) =>
      current.map((item) => (item.id === folder.id ? folder : item)),
    );
  }

  function handleDeleteFolder(folder: FolderType) {
    setFolders((current) => current.filter((item) => item.id !== folder.id));
  }

  return (
    <main className="p-6 md:p-8 gap-8 flex flex-col w-full max-w-6xl mx-auto">
      <NavMenu title="Pastas" hasSearch onSearch={setSearch} />
      {filteredFolders.length > 0 ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredFolders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              onChangeFolder={handleChangeFolder}
              onDeleteFolder={handleDeleteFolder}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted text-center py-8">
          {normalizedSearch
            ? `Nenhuma pasta encontrada para "${search.trim()}".`
            : "Você ainda não tem pastas. Crie a primeira no botão +."}
        </p>
      )}

      <FABButton
        onPress={() => setIsAddOpen(true)}
        className="bottom-[calc(var(--nav-inset)+1rem)]"
      />
      <DialogFormFolder
        variant="add"
        isOpen={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSubmit={handleAddFolder}
      />
    </main>
  );
}
