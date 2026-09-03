import { Button, ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { UserMinus } from "lucide-react";
import { useState } from "react";

import { updateMemberRole } from "@/api/classrooms";
import { ApiError } from "@/api/client";
import { UserIdentity } from "@/components/UserIdentity";
import { useFeedback } from "@/hooks/useFeedback";
import type { ClassroomMember, ClassroomRole } from "@/types/api/classroom";
import { roleLabel } from "@/utils/classroomPermissions";

import { DialogMemberRemoval } from "./DialogMemberRemoval";

type InvitableRole = Exclude<ClassroomRole, "owner">;

interface MemberRowProps {
  member: ClassroomMember;
  /** Papel de quem está olhando: só o dono vê os controles. */
  canManage: boolean;
  isCurrentUser: boolean;
  onChange: (member: ClassroomMember) => void;
  onRemove: (member: ClassroomMember) => void;
}

export function MemberRow({
  member,
  canManage,
  isCurrentUser,
  onChange,
  onRemove,
}: MemberRowProps) {
  const [isRemovalOpen, setIsRemovalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const feedback = useFeedback();
  const isOwnerMember = member.role === "owner";
  const showControls = canManage && !isOwnerMember;

  async function handleRoleChange(role: InvitableRole) {
    if (isSaving || role === member.role) return;

    const previous = member;

    setIsSaving(true);
    setError(null);
    // Otimista: a permissão muda na hora e volta atrás se o serviço recusar.
    onChange({ ...member, role });

    try {
      const updated = await updateMemberRole(
        member.classroomId,
        member.id,
        role,
      );

      feedback("sucesso");
      onChange(updated);
    } catch (apiError) {
      feedback("erro");
      onChange(previous);
      setError(
        apiError instanceof ApiError
          ? apiError.detail
          : "Não foi possível alterar a permissão. Tente novamente.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <li className="bg-surface shadow-surface flex flex-col gap-3 rounded-xl p-3">
      <div className="flex items-center gap-3">
        <UserIdentity
          user={member.user}
          size="sm"
          linkToProfile
          caption={
            isOwnerMember || !canManage
              ? `${roleLabel(member.role)}${isCurrentUser ? " · você" : ""}`
              : isCurrentUser
                ? "Você"
                : undefined
          }
          className="flex-1"
        />

        {showControls ? (
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            className="text-danger shrink-0"
            aria-label={`Remover @${member.user.username} da turma`}
            onPress={() => setIsRemovalOpen(true)}
          >
            <UserMinus className="size-4" />
          </Button>
        ) : null}
      </div>

      {showControls ? (
        <ToggleButtonGroup
          fullWidth
          selectionMode="single"
          disallowEmptySelection
          isDisabled={isSaving}
          selectedKeys={[member.role]}
          aria-label={`Permissão de @${member.user.username}`}
          onSelectionChange={(keys) => {
            const [next] = keys;

            if (next !== undefined) handleRoleChange(next as InvitableRole);
          }}
        >
          <ToggleButton id="viewer" className="flex-1">
            Membro
          </ToggleButton>
          <ToggleButton id="editor" className="flex-1">
            Editor
          </ToggleButton>
        </ToggleButtonGroup>
      ) : null}

      {error !== null ? (
        <p role="alert" className="text-danger text-sm text-pretty">
          {error}
        </p>
      ) : null}

      <DialogMemberRemoval
        member={member}
        isOpen={isRemovalOpen}
        onOpenChange={setIsRemovalOpen}
        onConfirm={onRemove}
      />
    </li>
  );
}
