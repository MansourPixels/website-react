import { Spinner } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { Brain, FileText, Map, PanelsTopLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { getClassroom, getFolder, listContents, searchClassroomContent } from "@/api/classrooms";
import { ApiError } from "@/api/client";
import { FABButton } from "@/components/FABButton";
import { NavMenu } from "@/components/NavMenu";
import { useAuth } from "@/contexts/AuthContext";
import type {
  Classroom,
  ClassroomContent,
  ClassroomFolder,
} from "@/types/api/classroom";
import { canAddContent, roleLabel } from "@/utils/classroomPermissions";
import { normalizeText } from "@/utils/text";

import { ClassroomContentTile } from "./components/ClassroomContentTile";
import { ClassroomStudyTypeCard } from "./components/ClassroomStudyTypeCard";
import { DialogAddContent } from "./components/DialogAddContent";

export default function ClassroomFolderPage() {
  const { turmaId, pastaId } = useParams();
  const { user } = useAuth();

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [folder, setFolder] = useState<ClassroomFolder | null>(null);
  const [contents, setContents] = useState<ClassroomContent[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ClassroomContent[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (turmaId === undefined || pastaId === undefined) return;

    let cancelled = false;

    Promise.all([
      getClassroom(turmaId),
      getFolder(turmaId, pastaId),
      listContents(turmaId, pastaId),
    ])
      .then(([classroomResult, folderResult, contentResult]) => {
        if (cancelled) return;

        setClassroom(classroomResult);
        setFolder(folderResult);
        setContents(contentResult);
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        setLoadError(
          error instanceof ApiError
            ? error.detail
            : "Não foi possível carregar a pasta. Tente novamente.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [turmaId, pastaId]);

  useEffect(() => {
    if (turmaId === undefined || pastaId === undefined || search.trim().length < 2) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setIsSearching(true);
      searchClassroomContent(turmaId, pastaId, search.trim(), controller.signal)
        .then((result) => setSearchResults(result))
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setSearchResults([]);
          setLoadError(error instanceof ApiError ? error.detail : "Não foi possível pesquisar o conteúdo.");
        })
        .finally(() => { if (!controller.signal.aborted) setIsSearching(false); });
    }, 400);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [pastaId, search, turmaId]);

  function handleAdded(created: ClassroomContent[]) {
    setContents((current) => [...created, ...(current ?? [])]);
  }

  function handleChanged(content: ClassroomContent) {
    setContents(
      (current) =>
        current?.map((item) => (item.id === content.id ? content : item)) ??
        null,
    );
  }

  function handleDeleted(content: ClassroomContent) {
    setContents(
      (current) => current?.filter((item) => item.id !== content.id) ?? null,
    );
  }

  if (loadError !== null) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 md:p-8">
        <NavMenu
          title="Pasta"
          hasBackButton
          backHref={turmaId === undefined ? "/turmas" : `/turmas/${turmaId}`}
        />
        <p className="text-danger py-8 text-center">{loadError}</p>
        <Link
          to="/turmas"
          className={buttonVariants({
            variant: "secondary",
            className: "mx-auto",
          })}
        >
          Voltar para turmas
        </Link>
      </main>
    );
  }

  if (classroom === null || folder === null) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 md:p-8">
        <NavMenu
          title="Pasta"
          hasBackButton
          backHref={turmaId === undefined ? "/turmas" : `/turmas/${turmaId}`}
        />
        <div className="flex flex-1 items-center justify-center p-6" aria-busy="true">
          <Spinner size="lg" />
          <span className="sr-only">Carregando a pasta</span>
        </div>
      </main>
    );
  }

  const canAdd = canAddContent(classroom.role);
  const normalizedSearch = normalizeText(search.trim());
  const displayedContents: ClassroomContent[] | null = search.trim().length >= 2
    ? searchResults
    : contents === null ? null : contents.filter((content) => normalizeText(`${content.title} ${content.fileName}`).includes(normalizedSearch));
  const hasContent = contents !== null && contents.length > 0;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 md:p-8">
      <NavMenu
        title={folder.name}
        hasBackButton
        backHref={`/turmas/${classroom.id}`}
        hasSearch
        onSearch={setSearch}
        isSearching={isSearching}
      />

      <p className="text-muted -mt-6 text-sm">
        {classroom.name} · você é {roleLabel(classroom.role).toLowerCase()}
      </p>

      {hasContent ? (
        <section aria-label="Modos de estudo" className="grid gap-3 sm:grid-cols-2">
          <ClassroomStudyTypeCard name="Resumo" description="Leia a síntese compartilhada da pasta." icon={FileText} iconClass="bg-violet-500" to={`/turmas/${classroom.id}/pastas/${folder.id}/resumo`} />
          <ClassroomStudyTypeCard name="Flash Cards" description="Revise conceitos com cartões compartilhados." icon={PanelsTopLeft} iconClass="bg-emerald-500" to={`/turmas/${classroom.id}/pastas/${folder.id}/flash-cards`} />
          <ClassroomStudyTypeCard name="Simulado de prova" description="Pratique com perguntas da pasta." icon={Brain} iconClass="bg-orange-500" to={`/turmas/${classroom.id}/pastas/${folder.id}/simulado-prova`} />
          <ClassroomStudyTypeCard name="Mapa mental" description="Explore os conceitos em um mapa." icon={Map} iconClass="bg-cyan-600" to={`/turmas/${classroom.id}/pastas/${folder.id}/mapa-mental`} />
        </section>
      ) : null}

       {displayedContents === null ? (
        <div className="flex flex-1 items-center justify-center p-6" aria-busy="true">
          <Spinner size="lg" />
          <span className="sr-only">Carregando o conteúdo da pasta</span>
        </div>
       ) : displayedContents.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
           {displayedContents.map((content) => (
            <ClassroomContentTile
              key={content.id}
              classroomId={classroom.id}
              folderId={folder.id}
              content={content}
              role={classroom.role}
              currentUserId={user?.id ?? ""}
              onChange={handleChanged}
              onDelete={handleDeleted}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted py-8 text-center text-pretty">
          {canAdd
            ? "Esta pasta está vazia. Adicione um material do Revi ou envie um arquivo no botão +."
            : "Esta pasta ainda não tem conteúdo. Como membro, você verá o material assim que alguém publicar."}
        </p>
      )}

      {canAdd ? (
        <>
          <FABButton
            aria-label="Adicionar conteúdo"
            onPress={() => setIsAddOpen(true)}
          />
          <DialogAddContent
            classroomId={classroom.id}
            folderId={folder.id}
            isOpen={isAddOpen}
            onOpenChange={setIsAddOpen}
            onSubmit={handleAdded}
          />
        </>
      ) : null}
    </main>
  );
}
