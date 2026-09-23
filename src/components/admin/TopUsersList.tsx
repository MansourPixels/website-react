import { Link } from "react-router";

import type { TopUsers } from "@/types/api/admin";
import { countOf, formatCount, formatMoney } from "@/utils/adminFormat";

/** Os usuários que mais custaram: tabela no desktop, cartões no celular; o uso sem dono fica numa linha à parte. */
export function TopUsersList({ top, detailSearch }: { top: TopUsers; detailSearch: string }) {
  if (top.users.length === 0 && top.unattributed.calls === 0) {
    return <p className="text-sm text-muted">Ninguém gerou custo no período.</p>;
  }

  const rate = top.usdBrlRate;
  const nobody = formatMoney(top.unattributed.costUsd, rate);

  return (
    <div className="flex flex-col gap-2">
      <table className="hidden w-full text-sm md:table">
        <thead className="text-left text-xs text-muted">
          <tr>
            <th className="py-2 font-medium">Usuário</th>
            <th className="py-2 font-medium">E-mail</th>
            <th className="py-2 text-right font-medium">Custo</th>
            <th className="py-2 text-right font-medium">Chamadas</th>
            <th className="py-2 text-right font-medium">Áudio (min)</th>
          </tr>
        </thead>
        <tbody>
          {top.users.map((user) => {
            const money = formatMoney(user.costUsd, rate);

            return (
              <tr key={user.ownerId} className="border-t">
                <td className="py-2">
                  <Link to={`/admin/custos/usuarios/${user.ownerId}?${detailSearch}`} className="font-medium underline-offset-2 hover:underline">
                    {user.username ?? "Usuário sem nome"}
                  </Link>
                </td>
                <td className="py-2 text-muted">{user.email ?? "—"}</td>
                <td className="py-2 text-right tabular-nums">
                  {money.brl} <span className="block text-xs text-muted">{money.usd}</span>
                </td>
                <td className="py-2 text-right tabular-nums">{formatCount(user.calls)}</td>
                <td className="py-2 text-right tabular-nums">{formatCount(Math.round(user.audioMinutes))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <ul className="flex flex-col gap-2 md:hidden">
        {top.users.map((user) => {
          const money = formatMoney(user.costUsd, rate);

          return (
            <li key={user.ownerId}>
              <Link
                to={`/admin/custos/usuarios/${user.ownerId}?${detailSearch}`}
                className="flex items-center justify-between gap-3 rounded-xl bg-surface p-3 shadow-surface"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{user.username ?? "Usuário sem nome"}</span>
                  <span className="truncate text-xs text-muted">{user.email ?? "—"}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end tabular-nums">
                  <span className="font-medium">{money.brl}</span>
                  <span className="text-xs text-muted">{countOf(user.calls, "chamada", "chamadas")}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {top.unattributed.calls > 0 ? (
        <p className="text-xs text-muted">
          Sem dono: {nobody.brl} ({nobody.usd}) em {countOf(top.unattributed.calls, "chamada", "chamadas")}, fora de qualquer conta.
        </p>
      ) : null}
    </div>
  );
}
