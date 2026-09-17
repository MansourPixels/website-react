import { Button, Spinner } from "@heroui/react";
import { useEffect, useState } from "react";

import { listMotherFolders } from "@/api/folders";
import { ApiError } from "@/api/client";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { FABButton } from "@/components/FABButton";
import { NavMenu } from "@/components/NavMenu";
import type { MotherFolder as FolderType } from "@/types/api/folder";
import { pageMeta } from "@/utils/pageMeta";
import { normalizeText } from "@/utils/text";
import { DialogFormFolder } from "./components/DialogFormFolder";
import { FolderCard } from "./components/FolderCard";

export function meta() {
  return pageMeta({
    title: "Pastas",
    description:
      "Todo o material que você já capturou, organizado por disciplina.",
  });
}

export default function FolderListPage() {
  const [folders, setFolders] = useState<FolderType[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setFolders(null);
    setLoadError(null);

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
  }, [reloadKey]);

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
        <ErrorState onRetry={() => setReloadKey((key) => key + 1)}>
          {loadError}
        </ErrorState>
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
      ) : normalizedSearch ? (
        <EmptyState>
          Nenhuma pasta encontrada para “{search.trim()}”.
        </EmptyState>
      ) : (
        <EmptyState
          action={
            <Button variant="secondary" onPress={() => setIsAddOpen(true)}>
              Criar pasta
            </Button>
          }
        >
          Você ainda não tem pastas. Crie a primeira para começar a organizar
          seu material.
        </EmptyState>
      )}

      {folders !== null && loadError === null ? (
        <FABButton
          onPress={() => setIsAddOpen(true)}
          className="bottom-[calc(var(--nav-inset)+1rem)]"
        />
      ) : null}
      <DialogFormFolder
        variant="add"
        isOpen={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSubmit={handleAddFolder}
      />
    </main>
  );
}
