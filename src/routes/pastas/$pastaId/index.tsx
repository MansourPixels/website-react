import { FABButton } from "@/components/FABButton";
import { NavMenu } from "@/components/NavMenu";
import { defaultFolders } from "@/mocks/folders";
import { getSubjectsByFolder } from "@/mocks/subjects";
import type { Subject } from "@/types/Subject";
import { normalizeText } from "@/utils/text";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DialogFormSubject } from "./-components/DialogFormSubject";
import { LoadingSubjectCard, SubjectCard } from "./-components/SubjectCard";

export const Route = createFileRoute("/pastas/$pastaId/")({
  component: SubjectListRoute,
});

function SubjectListRoute() {
  const { pastaId } = Route.useParams();

  // A rota é reaproveitada ao trocar de pasta, então a key reinicia o estado.
  return <SubjectListPage key={pastaId} folderId={pastaId} />;
}

function SubjectListPage({ folderId }: { folderId: string }) {
  const folder = defaultFolders.find((item) => item.id === folderId);
  const [subjects, setSubjects] = useState<Subject[]>(() =>
    getSubjectsByFolder(folderId),
  );
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [search, setSearch] = useState("");

  const normalizedSearch = normalizeText(search);
  const filteredSubjects = normalizedSearch
    ? subjects.filter((subject) =>
        normalizeText(subject.name).includes(normalizedSearch),
      )
    : subjects;

  function handleAddSubject(subject: Subject) {
    setSubjects((current) => [...current, subject]);
  }

  function handleChangeSubject(subject: Subject) {
    setSubjects((current) =>
      current.map((item) => (item.id === subject.id ? subject : item)),
    );
  }

  function handleDeleteSubject(subject: Subject) {
    setSubjects((current) => current.filter((item) => item.id !== subject.id));
  }

  return (
    <main className="p-6 gap-8 flex flex-col">
      <NavMenu
        title={folder?.name ?? "Pasta"}
        hasBackButton
        hasSearch
        onSearch={setSearch}
      />

      {filteredSubjects.length > 0 ? (
        <section
          id="subjects"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5"
        >
          {filteredSubjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onChangeSubject={handleChangeSubject}
              onDeleteSubject={handleDeleteSubject}
            />
          ))}
          <LoadingSubjectCard />
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
        isOpen={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSubmit={handleAddSubject}
      />
    </main>
  );
}
