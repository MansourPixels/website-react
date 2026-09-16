import { Button, Spinner } from "@heroui/react";
import { useEffect, useState } from "react";
import { useParams } from "react-router";

import { listContent } from "@/api/content";
import { listChildFolders, listMotherFolders } from "@/api/folders";
import { ApiError } from "@/api/client";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { FABButton } from "@/components/FABButton";
import { NavMenu } from "@/components/NavMenu";
import type { Content } from "@/types/api/content";
import type { ChildFolder } from "@/types/api/folder";
import { normalizeText } from "@/utils/text";
import { DialogFormSubject } from "./components/DialogFormSubject";
import { SubjectCard } from "./components/SubjectCard";

export default function SubjectListRoute() {
  const { pastaId } = useParams<"pastaId">() as { pastaId: string };

  return <SubjectListPage key={pastaId} folderId={pastaId} />;
}

function SubjectListPage({ folderId }: { folderId: string }) {
  const [folderName, setFolderName] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<ChildFolder[] | null>(null);
  const [subjectContents, setSubjectContents] = useState<
    Record<string, Content[] | null>
  >({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setSubjects(null);
    setLoadError(null);

    Promise.all([listMotherFolders(), listChildFolders(folderId)])
      .then(([motherFolders, childFolders]) => {
        if (cancelled) return;

        const folder = motherFolders.find((item) => item.id === folderId);

        // Sem isto, uma pasta inexistente (ou de outra conta) cai no estado
        // vazio normal e se disfarça de "pasta sem assuntos".
        if (folder === undefined) {
          setLoadError("Esta pasta não existe ou não está mais disponível.");
          return;
        }

        setFolderName(folder.name);
        setSubjects(childFolders);
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        setLoadError(
          error instanceof ApiError
            ? error.detail
            : "Não foi possível carregar os assuntos desta pasta. Tente novamente.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [folderId, reloadKey]);

  const subjectIds = subjects?.map((subject) => subject.id).join(",") ?? "";

  useEffect(() => {
    if (!subjectIds) return;

    const ids = subjectIds.split(",");
    let cancelled = false;

    Promise.allSettled(ids.map((id) => listContent(id))).then((results) => {
      if (cancelled) return;

      setSubjectContents((current) => {
        const next = { ...current };

        results.forEach((result, index) => {
          // `null` marca a falha: sem isso o id que rejeitou nunca sai de
          // `undefined` e o esqueleto do cartão pisca indefinidamente.
          next[ids[index]] =
            result.status === "fulfilled" ? result.value : null;
        });

        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [subjectIds]);

  const normalizedSearch = normalizeText(search);
  const filteredSubjects =
    subjects === null
      ? []
      : normalizedSearch
        ? subjects.filter((subject) =>
            normalizeText(subject.name).includes(normalizedSearch),
          )
        : subjects;

  function handleAddSubject(subject: ChildFolder) {
    setSubjects((current) => [...(current ?? []), subject]);
  }

  function handleChangeSubject(subject: ChildFolder) {
    setSubjects(
      (current) =>
        current?.map((item) => (item.id === subject.id ? subject : item)) ??
        null,
    );
  }

  function handleDeleteSubject(subject: ChildFolder) {
    setSubjects(
      (current) => current?.filter((item) => item.id !== subject.id) ?? null,
    );
  }

  return (
    <main className="p-6 md:p-8 gap-8 flex flex-col w-full max-w-6xl mx-auto">
      <NavMenu
        title={folderName ?? "Pasta"}
        hasBackButton
        hasSearch
        onSearch={setSearch}
      />

      {subjects === null && loadError === null ? (
        <div className="flex flex-1 items-center justify-center p-6" aria-busy="true">
          <Spinner size="lg" />
          <span className="sr-only">Carregando assuntos</span>
        </div>
      ) : loadError !== null ? (
        <ErrorState onRetry={() => setReloadKey((key) => key + 1)}>
          {loadError}
        </ErrorState>
      ) : filteredSubjects.length > 0 ? (
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredSubjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              contents={subjectContents[subject.id]}
              onChangeSubject={handleChangeSubject}
              onDeleteSubject={handleDeleteSubject}
            />
          ))}
        </section>
      ) : normalizedSearch ? (
        <EmptyState>
          Nenhum assunto encontrado para “{search.trim()}”.
        </EmptyState>
      ) : (
        <EmptyState
          action={
            <Button variant="secondary" onPress={() => setIsAddOpen(true)}>
              Criar assunto
            </Button>
          }
        >
          Esta pasta ainda não tem assuntos. Crie o primeiro para guardar o
          material dela.
        </EmptyState>
      )}

      {subjects !== null && loadError === null ? (
        <FABButton
          onPress={() => setIsAddOpen(true)}
          className="bottom-[calc(var(--nav-inset)+1rem)]"
        />
      ) : null}
      <DialogFormSubject
        variant="add"
        motherFolderId={folderId}
        isOpen={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSubmit={handleAddSubject}
      />
    </main>
  );
}
