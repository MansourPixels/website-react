import { Button, Spinner } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { KeyRound, Trophy, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { listClassrooms, listMyInvites } from "@/api/classrooms";
import { ApiError } from "@/api/client";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { FABButton } from "@/components/FABButton";
import { NavMenu } from "@/components/NavMenu";
import type { Classroom, ClassroomInvite } from "@/types/api/classroom";
import { pageMeta } from "@/utils/pageMeta";

import { ClassroomCard } from "./components/ClassroomCard";
import { ClassroomInviteRow } from "./components/ClassroomInviteRow";
import { DialogFormClassroom } from "./components/DialogFormClassroom";
import { DialogJoinByCode } from "./components/DialogJoinByCode";

export function meta() {
  return pageMeta({
    title: "Turmas",
    description:
      "As turmas de que você participa e o material que a turma compartilha.",
  });
}

const shortcuts = [
  {
    to: "/amigos",
    icon: UserPlus,
    title: "Amigos",
    description: "Busque colegas pelo username e responda solicitações.",
  },
  {
    to: "/ranking",
    icon: Trophy,
    title: "Ranking",
    description: "Compare seu XP no geral, entre amigos e por turma.",
  },
];

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState<Classroom[] | null>(null);
  const [invites, setInvites] = useState<ClassroomInvite[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setClassrooms(null);
    setInvites([]);
    setLoadError(null);

    Promise.all([listClassrooms(), listMyInvites()])
      .then(([classroomList, inviteList]) => {
        if (cancelled) return;

        setClassrooms(classroomList);
        setInvites(inviteList);
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        setLoadError(
          error instanceof ApiError
            ? error.detail
            : "Não foi possível carregar suas turmas. Tente novamente.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function handleAdd(classroom: Classroom) {
    setClassrooms((current) =>
      [...(current ?? []), classroom].sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR"),
      ),
    );
  }

  function handleInviteAccepted(
    invite: ClassroomInvite,
    classroom: Classroom,
  ) {
    setInvites((current) => current.filter((item) => item.id !== invite.id));
    handleAdd(classroom);
  }

  function handleInviteDeclined(invite: ClassroomInvite) {
    setInvites((current) => current.filter((item) => item.id !== invite.id));
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 md:p-8">
      <NavMenu title="Turmas" />

      <section className="flex flex-col gap-3">
        {shortcuts.map(({ to, icon: Icon, title, description }) => (
          <Link
            key={to}
            to={to}
            className={buttonVariants({
              variant: "ghost",
              className:
                "bg-surface shadow-surface flex h-auto w-full items-center gap-3 rounded-xl p-3",
            })}
          >
            <span className="bg-accent text-accent-foreground flex size-9 shrink-0 items-center justify-center rounded-xl">
              <Icon className="size-5" />
            </span>
            <span className="flex-1 text-left">
              <span className="block font-semibold">{title}</span>
              <span className="text-muted block text-xs font-normal whitespace-normal">
                {description}
              </span>
            </span>
          </Link>
        ))}
      </section>

      {invites.length > 0 ? (
        <section className="flex flex-col gap-3">
          <header className="flex flex-col gap-1">
            <h2 className="font-semibold">Convites pendentes</h2>
            <p className="text-muted text-xs text-balance">
              Aceite para ver as pastas e o conteúdo da turma.
            </p>
          </header>
          <ul className="flex flex-col gap-2">
            {invites.map((invite) => (
              <ClassroomInviteRow
                key={invite.id}
                invite={invite}
                onAccepted={handleInviteAccepted}
                onDeclined={handleInviteDeclined}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-col gap-4">
        <header className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">Suas turmas</h2>
          <Button
            variant="secondary"
            size="sm"
            onPress={() => setIsJoinOpen(true)}
          >
            <KeyRound className="size-4" />
            Entrar com código
          </Button>
        </header>

        {classrooms === null && loadError === null ? (
          <div
            className="flex flex-1 items-center justify-center p-6"
            aria-busy="true"
          >
            <Spinner size="lg" />
            <span className="sr-only">Carregando suas turmas</span>
          </div>
        ) : loadError !== null ? (
          <ErrorState onRetry={() => setReloadKey((key) => key + 1)}>
            {loadError}
          </ErrorState>
        ) : (classrooms ?? []).length > 0 ? (
          <ul className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {(classrooms ?? []).map((classroom) => (
              <li key={classroom.id}>
                <ClassroomCard classroom={classroom} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            action={
              <Button variant="secondary" onPress={() => setIsAddOpen(true)}>
                Criar turma
              </Button>
            }
          >
            Você ainda não participa de nenhuma turma. Crie a primeira ou entre
            com um código de convite.
          </EmptyState>
        )}
      </section>

      <FABButton
        aria-label="Criar turma"
        onPress={() => setIsAddOpen(true)}
        className="bottom-[calc(var(--nav-inset)+1rem)]"
      />

      <DialogFormClassroom
        variant="add"
        isOpen={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSubmit={handleAdd}
      />
      <DialogJoinByCode isOpen={isJoinOpen} onOpenChange={setIsJoinOpen} />
    </main>
  );
}
