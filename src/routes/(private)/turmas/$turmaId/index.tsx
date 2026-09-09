import { Button, ButtonGroup, Popover, Spinner } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import {
  Ellipsis,
  LogOut,
  PencilLine,
  Trash,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";

import { getClassroom, listFolders } from "@/api/classrooms";
import { ApiError } from "@/api/client";
import { FABButton } from "@/components/FABButton";
import { NavMenu } from "@/components/NavMenu";
import type { Classroom, ClassroomFolder } from "@/types/api/classroom";
import {
  canInviteMembers,
  canLeaveClassroom,
  canManageClassroom,
  canManageFolders,
  roleDescription,
  roleLabel,
} from "@/utils/classroomPermissions";
import { profilePath } from "@/utils/profile";

import { DialogFormClassroom } from "../components/DialogFormClassroom";
import { ClassroomFolderCard } from "./components/ClassroomFolderCard";
import { DialogFormClassroomFolder } from "./components/DialogFormClassroomFolder";
import { DialogInviteMember } from "./components/DialogInviteMember";
import { DialogLeaveClassroom } from "./components/DialogLeaveClassroom";

export default function ClassroomDetailPage() {
  const { turmaId } = useParams();
  const navigate = useNavigate();

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [folders, setFolders] = useState<ClassroomFolder[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [isExitOpen, setIsExitOpen] = useState(false);

  useEffect(() => {
    if (turmaId === undefined) return;

    let cancelled = false;

    Promise.all([getClassroom(turmaId), listFolders(turmaId)])
      .then(([classroomResult, folderResult]) => {
        if (cancelled) return;

        setClassroom(classroomResult);
        setFolders(folderResult);
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        setLoadError(
          error instanceof ApiError
            ? error.detail
            : "Não foi possível carregar a turma. Tente novamente.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [turmaId]);

  function handleFolderAdded(folder: ClassroomFolder) {
    setFolders((current) => [...(current ?? []), folder]);
    setClassroom((current) =>
      current === null
        ? null
        : { ...current, folderCount: current.folderCount + 1 },
    );
  }

  function handleFolderChanged(folder: ClassroomFolder) {
    setFolders(
      (current) =>
        current?.map((item) => (item.id === folder.id ? folder : item)) ?? null,
    );
  }

  function handleFolderDeleted(folder: ClassroomFolder) {
    setFolders(
      (current) => current?.filter((item) => item.id !== folder.id) ?? null,
    );
    setClassroom((current) =>
      current === null
        ? null
        : { ...current, folderCount: Math.max(0, current.folderCount - 1) },
    );
  }

  if (loadError !== null) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 md:p-8">
        <NavMenu title="Turma" hasBackButton backHref="/turmas" />
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

  if (classroom === null) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 md:p-8">
        <NavMenu title="Turma" hasBackButton backHref="/turmas" />
        <div className="flex flex-1 items-center justify-center p-6" aria-busy="true">
          <Spinner size="lg" />
          <span className="sr-only">Carregando a turma</span>
        </div>
      </main>
    );
  }

  const isOwner = canManageClassroom(classroom.role);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 md:p-8">
      <NavMenu title={classroom.name} hasBackButton backHref="/turmas" />

      <section className="bg-surface shadow-surface flex flex-col gap-4 rounded-3xl p-4">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="size-9 shrink-0 rounded-xl"
            style={{ backgroundColor: classroom.color }}
          />

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-muted text-xs">
              Criada por{" "}
              <Link
                to={profilePath(classroom.ownerUsername)}
                className="hover:underline"
              >
                @{classroom.ownerUsername}
              </Link>
            </p>
            {classroom.description.length > 0 ? (
              <p className="text-sm text-pretty">{classroom.description}</p>
            ) : null}
          </div>

          {isOwner || canLeaveClassroom(classroom.role) ? (
            <Popover>
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                aria-label={`Opções da turma ${classroom.name}`}
              >
                <Ellipsis className="size-4" />
              </Button>
              <Popover.Content>
                <Popover.Dialog className="p-0">
                  <ButtonGroup orientation="vertical" className="w-48">
                    {isOwner ? (
                      <Button
                        variant="ghost"
                        className="justify-start border-b"
                        onPress={() => setIsEditOpen(true)}
                      >
                        <PencilLine className="size-4" />
                        Editar turma
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      className="text-danger justify-start"
                      onPress={() => setIsExitOpen(true)}
                    >
                      {isOwner ? (
                        <Trash className="size-4" />
                      ) : (
                        <LogOut className="size-4" />
                      )}
                      {isOwner ? "Excluir turma" : "Sair da turma"}
                    </Button>
                  </ButtonGroup>
                </Popover.Dialog>
              </Popover.Content>
            </Popover>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Link
            to={`/turmas/${classroom.id}/membros`}
            className={buttonVariants({
              variant: "secondary",
              size: "sm",
              className: "w-full sm:w-fit",
            })}
          >
            <Users className="size-4" />
            {classroom.memberCount}{" "}
            {classroom.memberCount === 1 ? "membro" : "membros"}
          </Link>

          {canInviteMembers(classroom.role) ? (
            <Button
              size="sm"
              className="w-full sm:w-fit"
              onPress={() => setIsInviteOpen(true)}
            >
              <UserPlus className="size-4" />
              Convidar
            </Button>
          ) : null}

          <p className="text-muted text-xs sm:ml-auto">
            Você é <strong className="font-medium">{roleLabel(classroom.role).toLowerCase()}</strong>
            {" · "}
            {roleDescription(classroom.role)}
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-semibold">Pastas</h2>

        {folders === null ? (
          <div className="flex items-center justify-center py-8" aria-busy="true">
            <Spinner size="lg" />
            <span className="sr-only">Carregando as pastas da turma</span>
          </div>
        ) : folders.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {folders.map((folder) => (
              <ClassroomFolderCard
                key={folder.id}
                folder={folder}
                role={classroom.role}
                onChange={handleFolderChanged}
                onDelete={handleFolderDeleted}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted py-8 text-center text-pretty">
            {canManageFolders(classroom.role)
              ? "Esta turma ainda não tem pastas. Crie a primeira no botão +."
              : "Esta turma ainda não tem pastas. Assim que o dono criar uma, ela aparece aqui."}
          </p>
        )}
      </section>

      {canManageFolders(classroom.role) ? (
        <FABButton
          aria-label="Criar pasta na turma"
          onPress={() => setIsFolderOpen(true)}
        />
      ) : null}

      <DialogFormClassroom
        variant="edit"
        classroom={classroom}
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSubmit={setClassroom}
      />
      <DialogFormClassroomFolder
        variant="add"
        classroomId={classroom.id}
        isOpen={isFolderOpen}
        onOpenChange={setIsFolderOpen}
        onSubmit={handleFolderAdded}
      />
      <DialogInviteMember
        classroomId={classroom.id}
        isOpen={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        onInvited={() => {}}
      />
      <DialogLeaveClassroom
        classroom={classroom}
        action={isOwner ? "delete" : "leave"}
        isOpen={isExitOpen}
        onOpenChange={setIsExitOpen}
        onConfirm={() => navigate("/turmas", { replace: true })}
      />
    </main>
  );
}
