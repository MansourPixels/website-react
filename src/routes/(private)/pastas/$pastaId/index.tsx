import { Spinner } from "@heroui/react";
import { useEffect, useState } from "react";
import { useParams } from "react-router";

import { listContent } from "@/api/content";
import { listChildFolders, listMotherFolders } from "@/api/folders";
import { ApiError } from "@/api/client";
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
    Record<string, Content[]>
  >({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([listMotherFolders(), listChildFolders(folderId)])
      .then(([motherFolders, childFolders]) => {
        if (cancelled) return;

        setFolderName(
          motherFolders.find((item) => item.id === folderId)?.name ?? null,
        );
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
  }, [folderId]);

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
          if (result.status === "fulfilled") next[ids[index]] = result.value;
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
        <p className="text-danger text-center py-8">{loadError}</p>
      ) : filteredSubjects.length > 0 ? (
        <section
          id="subjects"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5"
        >
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
      ) : (
        <p className="text-muted text-center py-8">
          {normalizedSearch
            ? `Nenhum assunto encontrado para "${search.trim()}".`
            : "Esta pasta ainda não tem assuntos. Crie o primeiro no botão +."}
        </p>
      )}

      <FABButton onPress={() => setIsAddOpen(true)} />
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
