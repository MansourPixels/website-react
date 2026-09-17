import { Button, ButtonGroup, Popover, Spinner } from "@heroui/react";
import { Ellipsis, Link2, Mail, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { getClassroom, listInvites, listMembers } from "@/api/classrooms";
import { ApiError } from "@/api/client";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { NavMenu } from "@/components/NavMenu";
import { useAuth } from "@/contexts/AuthContext";
import type {
  Classroom,
  ClassroomInvite,
  ClassroomMember,
} from "@/types/api/classroom";
import { canManageMembers, roleLabel } from "@/utils/classroomPermissions";
import { pageMeta } from "@/utils/pageMeta";
import { profilePath } from "@/utils/profile";

import { DialogInviteMember } from "../components/DialogInviteMember";
import { DialogInviteRevocation } from "./components/DialogInviteRevocation";
import { MemberRow } from "./components/MemberRow";

export function meta() {
  return pageMeta({
    title: "Membros da turma",
    description: "Quem participa da turma e o papel de cada um.",
  });
}

function InviteRow({
  invite,
  onRevoked,
}: {
  invite: ClassroomInvite;
  onRevoked: (invite: ClassroomInvite) => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRevokeOpen, setIsRevokeOpen] = useState(false);

  const isLink = invite.invitee === null;

  return (
    <li className="bg-surface shadow-surface flex flex-col gap-2 rounded-xl p-3">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="bg-default text-muted flex size-9 shrink-0 items-center justify-center rounded-xl"
        >
          {isLink ? <Link2 className="size-4" /> : <Mail className="size-4" />}
        </span>

        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">
            {isLink ? (
              `Link ${invite.code}`
            ) : (
              <Link
                to={profilePath(invite.invitee?.username ?? "")}
                className="hover:underline"
              >
                @{invite.invitee?.username}
              </Link>
            )}
          </span>
          <span className="text-muted truncate text-xs">
            Convite como {roleLabel(invite.role).toLowerCase()}
          </span>
        </div>

        {/* Revogar apaga o convite: nunca exposto na linha. */}
        <Popover isOpen={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            className="shrink-0"
            aria-label={`Opções do convite ${isLink ? invite.code : `de @${invite.invitee?.username}`}`}
          >
            <Ellipsis className="size-4" />
          </Button>
          <Popover.Content>
            <Popover.Dialog className="p-0">
              <ButtonGroup orientation="vertical" className="w-48">
                <Button
                  variant="ghost"
                  className="text-danger justify-start"
                  onPress={() => {
                    setIsMenuOpen(false);
                    setIsRevokeOpen(true);
                  }}
                >
                  <X className="size-4" />
                  Revogar convite
                </Button>
              </ButtonGroup>
            </Popover.Dialog>
          </Popover.Content>
        </Popover>
      </div>

      <DialogInviteRevocation
        invite={invite}
        isOpen={isRevokeOpen}
        onOpenChange={setIsRevokeOpen}
        onConfirm={onRevoked}
      />
    </li>
  );
}

export default function ClassroomMembersPage() {
  const { turmaId } = useParams();
  const { user } = useAuth();

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [members, setMembers] = useState<ClassroomMember[] | null>(null);
  const [invites, setInvites] = useState<ClassroomInvite[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (turmaId === undefined) return;

    let cancelled = false;

    setClassroom(null);
    setMembers(null);
    setInvites([]);
    setLoadError(null);

    Promise.all([getClassroom(turmaId), listMembers(turmaId)])
      .then(async ([classroomResult, memberResult]) => {
        if (cancelled) return;

        setClassroom(classroomResult);
        setMembers(memberResult);

        // Convites são visíveis só para o dono: pedir sempre daria 403 para
        // editores e membros, e sujaria a tela com um erro esperado.
        if (!canManageMembers(classroomResult.role)) return;

        const inviteResult = await listInvites(turmaId);

        if (!cancelled) setInvites(inviteResult);
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        setLoadError(
          error instanceof ApiError
            ? error.detail
            : "Não foi possível carregar os membros. Tente novamente.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [turmaId, reloadKey]);

  function handleMemberChanged(member: ClassroomMember) {
    setMembers(
      (current) =>
        current?.map((item) => (item.id === member.id ? member : item)) ?? null,
    );
  }

  function handleMemberRemoved(member: ClassroomMember) {
    setMembers(
      (current) => current?.filter((item) => item.id !== member.id) ?? null,
    );
  }

  const canManage = classroom !== null && canManageMembers(classroom.role);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 md:p-8">
      <NavMenu
        title="Membros"
        hasBackButton
        backHref={turmaId === undefined ? "/turmas" : `/turmas/${turmaId}`}
      />

      {loadError !== null ? (
        <ErrorState onRetry={() => setReloadKey((key) => key + 1)}>
          {loadError}
        </ErrorState>
      ) : members === null || classroom === null ? (
        <div className="flex flex-1 items-center justify-center p-6" aria-busy="true">
          <Spinner size="lg" />
          <span className="sr-only">Carregando os membros da turma</span>
        </div>
      ) : (
        <>
          <section className="flex flex-col gap-4">
            <header className="flex items-center justify-between gap-2">
              <h2 className="min-w-0 font-semibold break-words">
                <span className="tabular-nums">{members.length}</span>{" "}
                {members.length === 1 ? "membro" : "membros"} em{" "}
                {classroom.name}
              </h2>
              {canManage ? (
                <Button
                  size="sm"
                  variant="secondary"
                  className="shrink-0"
                  onPress={() => setIsInviteOpen(true)}
                >
                  <UserPlus className="size-4" />
                  Convidar
                </Button>
              ) : null}
            </header>

            <ul className="flex flex-col gap-2">
              {members.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  canManage={canManage}
                  isCurrentUser={member.user.id === user?.id}
                  onChange={handleMemberChanged}
                  onRemove={handleMemberRemoved}
                />
              ))}
            </ul>
          </section>

          {canManage ? (
            <section className="flex flex-col gap-4">
              <header className="flex flex-col gap-1">
                <h2 className="font-semibold">Convites pendentes</h2>
                <p className="text-muted text-xs text-balance">
                  Convites nominais e links ativos desta turma.
                </p>
              </header>

              {invites.length === 0 ? (
                <EmptyState isCompact>
                  Nenhum convite aguardando resposta.
                </EmptyState>
              ) : (
                <ul className="flex flex-col gap-2">
                  {invites.map((invite) => (
                    <InviteRow
                      key={invite.id}
                      invite={invite}
                      onRevoked={(revoked) =>
                        setInvites((current) =>
                          current.filter((item) => item.id !== revoked.id),
                        )
                      }
                    />
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          <DialogInviteMember
            classroomId={classroom.id}
            isOpen={isInviteOpen}
            onOpenChange={setIsInviteOpen}
            onInvited={(invite) =>
              setInvites((current) => [invite, ...current])
            }
          />
        </>
      )}
    </main>
  );
}
