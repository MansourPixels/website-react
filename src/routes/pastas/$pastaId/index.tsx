import { FABButton } from "@/components/FABButton";
import { NavMenu } from "@/components/NavMenu";
import type { Subject } from "@/types/Subject";
import { normalizeText } from "@/utils/text";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DialogFormSubject } from "./-components/DialogFormSubject";
import { LoadingSubjectCard, SubjectCard } from "./-components/SubjectCard";

export const Route = createFileRoute("/pastas/$pastaId/")({
  component: SubjectListPage,
});

const defaultSubjects: Subject[] = [
  {
    id: "1",
    name: "Equação de terceiro grau",
    images: Array.from(
      { length: 4 },
      (_, index) => `https://picsum.photos/300/300?random=${index}`,
    ),
  },
  {
    id: "2",
    name: "Trigonometria no triângulo retângulo",
    images: Array.from(
      { length: 4 },
      (_, index) => `https://picsum.photos/300/300?random=${index + 4}`,
    ),
  },
];

function SubjectListPage() {
  const [subjects, setSubjects] = useState<Subject[]>(defaultSubjects);
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
    <main className="p-6 md:p-8 gap-8 flex flex-col w-full max-w-6xl mx-auto">
      <NavMenu
        title="Matemática"
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
