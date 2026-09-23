import { Button } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { Link } from "react-router";

import type { AdminUser } from "@/types/api/admin";
import { countOf, formatCount, formatMoney } from "@/utils/adminFormat";

import { AccountStatusBadge } from "./AccountStatusBadge";
import type { AccountAction } from "./DialogAccountAction";

interface AdminUsersListProps {
  users: AdminUser[];
  usdBrlRate: number;
  /** A conta de quem está usando: não oferece "Desativar" para ela. */
  currentOwnerId: string | null;
  onAction: (user: AdminUser, action: AccountAction) => void;
}

/** Os usuários de uma página da busca: tabela no desktop, cartões no celular. */
export function AdminUsersList({ users, usdBrlRate, currentOwnerId, onAction }: AdminUsersListProps) {
  return (
    <>
      <table className="hidden w-full text-sm md:table">
        <thead className="text-left text-xs text-muted">
          <tr>
            <th className="py-2 font-medium">Usuário</th>
            <th className="py-2 font-medium">E-mail</th>
            <th className="py-2 font-medium">Conta</th>
            <th className="py-2 text-right font-medium">Custo 30 dias</th>
            <th className="py-2 text-right font-medium">Chamadas 30 dias</th>
            <th className="py-2 text-right font-medium">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const money = formatMoney(user.costUsd30d, usdBrlRate);

            return (
              <tr key={user.ownerId} className="border-t">
                <td className="max-w-48 truncate py-2 font-medium">{user.username}</td>
                <td className="max-w-56 truncate py-2 text-muted">{user.email ?? "—"}</td>
                <td className="py-2">
                  <AccountStatusBadge enabled={user.enabled} />
                </td>
                <td className="py-2 text-right tabular-nums">
                  {money.brl} <span className="block text-xs text-muted">{money.usd}</span>
                </td>
                <td className="py-2 text-right tabular-nums">{formatCount(user.calls30d)}</td>
                <td className="py-2">
                  <UserActions user={user} isSelf={user.ownerId === currentOwnerId} onAction={onAction} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <ul className="flex flex-col gap-2 md:hidden">
        {users.map((user) => {
          const money = formatMoney(user.costUsd30d, usdBrlRate);

          return (
            <li key={user.ownerId} className="flex flex-col gap-3 rounded-xl bg-surface p-3 shadow-surface">
              <div className="flex items-start justify-between gap-3">
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{user.username}</span>
                  <span className="truncate text-xs text-muted">{user.email ?? "—"}</span>
                </span>
                <AccountStatusBadge enabled={user.enabled} />
              </div>
              <p className="text-xs text-muted tabular-nums">
                Últimos 30 dias: <span className="font-medium text-foreground">{money.brl}</span> ({money.usd}) em{" "}
                {countOf(user.calls30d, "chamada", "chamadas")}
              </p>
              <UserActions user={user} isSelf={user.ownerId === currentOwnerId} onAction={onAction} />
            </li>
          );
        })}
      </ul>
    </>
  );
}

function UserActions({
  user,
  isSelf,
  onAction,
}: {
  user: AdminUser;
  isSelf: boolean;
  onAction: (user: AdminUser, action: AccountAction) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Link
        to={`/admin/custos/usuarios/${user.ownerId}`}
        className={buttonVariants({ variant: "ghost", size: "sm" })}
        aria-label={`Ver uso de ${user.username}`}
      >
        Ver uso
      </Link>
      {user.enabled ? (
        isSelf ? (
          <span className="px-2 text-xs text-muted">Sua conta</span>
        ) : (
          <Button
            size="sm"
            variant="danger-soft"
            aria-label={`Desativar a conta de ${user.username}`}
            onPress={() => onAction(user, "disable")}
          >
            Desativar
          </Button>
        )
      ) : (
        <Button
          size="sm"
          variant="secondary"
          aria-label={`Reativar a conta de ${user.username}`}
          onPress={() => onAction(user, "enable")}
        >
          Reativar
        </Button>
      )}
    </div>
  );
}
