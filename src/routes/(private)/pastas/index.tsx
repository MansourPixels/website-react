import { Spinner } from "@heroui/react";
import { useEffect, useState } from "react";

import { listMotherFolders } from "@/api/folders";
import { ApiError } from "@/api/client";
import { FABButton } from "@/components/FABButton";
import { NavMenu } from "@/components/NavMenu";
import type { MotherFolder as FolderType } from "@/types/api/folder";
import { normalizeText } from "@/utils/text";
import { DialogFormFolder } from "./components/DialogFormFolder";
import { FolderCard } from "./components/FolderCard";

export default function FolderListPage() {
  const [folders, setFolders] = useState<FolderType[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    listMotherFolders()
      .then((result) => {
        if (!cancelled) setFolders(result);
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        setLoadError(
          error instanceof ApiError
            ? error.detail
            : "Não foi possível carregar suas pastas. Tente novamente.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedSearch = normalizeText(search);
  const filteredFolders =
    folders === null
      ? []
      : normalizedSearch
        ? folders.filter((folder) =>
            normalizeText(folder.name).includes(normalizedSearch),
          )
        : folders;

  function handleAddFolder(folder: FolderType) {
    setFolders((current) => [...(current ?? []), folder]);
  }

  function handleChangeFolder(folder: FolderType) {
    setFolders(
      (current) =>
        current?.map((item) => (item.id === folder.id ? folder : item)) ??
        null,
    );
  }

  function handleDeleteFolder(folder: FolderType) {
    setFolders(
      (current) => current?.filter((item) => item.id !== folder.id) ?? null,
    );
  }

  return (
    <main className="p-6 md:p-8 gap-8 flex flex-col w-full max-w-6xl mx-auto">
      <NavMenu title="Pastas" hasSearch onSearch={setSearch} />

      {folders === null && loadError === null ? (
        <div className="flex flex-1 items-center justify-center p-6" aria-busy="true">
          <Spinner size="lg" />
          <span className="sr-only">Carregando pastas</span>
        </div>
      ) : loadError !== null ? (
        <p className="text-danger text-center py-8">{loadError}</p>
      ) : filteredFolders.length > 0 ? (
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
