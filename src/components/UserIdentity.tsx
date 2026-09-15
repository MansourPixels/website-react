import type { PublicUser } from "@/types/api/social";
import { profilePath } from "@/utils/profile";
import { getInitials } from "@/utils/text";
import { Avatar, cn } from "@heroui/react";
import type { ReactNode } from "react";
import { Link } from "react-router";

interface UserIdentityProps {
  user: PublicUser;
  /** Linha de apoio: XP, papel na turma, data de amizade. */
  caption?: ReactNode;
  /**
   * Liga a navegação para o perfil público. É opt-in de propósito: dentro de um
   * diálogo de confirmação, tirar a pessoa da tela no meio de um "tem certeza?"
   * seria armadilha.
   */
  linkToProfile?: boolean;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Avatar + nome + `@username`, do jeito que aparece em busca de usuários,
 * amigos, ranking, membros de turma e convites.
 */
export function UserIdentity({
  user,
  caption,
  linkToProfile = false,
  size = "md",
  className,
}: UserIdentityProps) {
  const content = (
    <>
      <Avatar
        variant="soft"
        color="accent"
        className={cn(
          "shrink-0 rounded-xl",
          size === "sm" ? "size-9" : "size-11",
        )}
      >
        {user.avatarUrl !== null ? (
          <Avatar.Image src={user.avatarUrl} alt="" />
        ) : null}
        <Avatar.Fallback>
          {getInitials(user.displayName || user.username)}
        </Avatar.Fallback>
      </Avatar>

      <div className="flex min-w-0 flex-col">
        <span
          className={cn(
            "truncate font-medium",
            size === "sm" ? "text-sm" : "text-base",
            linkToProfile && "group-hover/identity:underline",
          )}
        >
          {user.displayName || user.username}
        </span>
        <span className="text-muted truncate text-xs">@{user.username}</span>
        {caption !== undefined ? (
          <span className="text-muted truncate text-xs">{caption}</span>
        ) : null}
      </div>
    </>
  );

  // O `className` que vem do chamador (com frequência `flex-1`) precisa cair na
  // raiz, seja ela `div` ou `Link`, senão o layout da linha desanda.
  const rootClassName = cn("flex min-w-0 items-center gap-3", className);

  if (!linkToProfile) {
    return <div className={rootClassName}>{content}</div>;
  }

  return (
    <Link
      to={profilePath(user.username)}
      className={cn("group/identity rounded-xl", rootClassName)}
      aria-label={`Ver o perfil de @${user.username}`}
    >
      {content}
    </Link>
  );
}
