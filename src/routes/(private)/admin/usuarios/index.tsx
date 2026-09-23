import { Button, SearchField } from "@heroui/react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

import { disableUser, enableUser, listAdminUsers } from "@/api/admin";
import { getWhoami } from "@/api/user";
import { AdminBlock } from "@/components/admin/AdminBlock";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminUsersList } from "@/components/admin/AdminUsersList";
import { type AccountAction, DialogAccountAction } from "@/components/admin/DialogAccountAction";
import { ExchangeRateNote } from "@/components/admin/ExchangeRateNote";
import { useAdminResource } from "@/hooks/useAdminResource";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { AdminUser } from "@/types/api/admin";
import { countOf } from "@/utils/adminFormat";
import { accountActionError } from "@/utils/adminErrors";
import { applyEnabled, pageCount, sortByCost, userSearchFromUrl, userSearchToUrl } from "@/utils/adminUsers";
import { pageMeta } from "@/utils/pageMeta";

export function meta() {
  return pageMeta({
    title: "Usuários · Administração",
    description: "Busque contas, veja o custo de cada uma e desative quem precisa perder o acesso.",
  });
}

const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 300;

export default function AdminUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = userSearchFromUrl(searchParams);

  // O campo segue a URL (voltar no navegador troca a busca), e a URL segue o
  // campo depois que a pessoa para de digitar.
  const [term, setTerm] = useState(search.query);
  const [urlQuery, setUrlQuery] = useState(search.query);
  if (urlQuery !== search.query) {
    setUrlQuery(search.query);
    if (term.trim() !== search.query) setTerm(search.query);
  }

  const debouncedTerm = useDebouncedValue(term, SEARCH_DELAY_MS).trim();
  useEffect(() => {
    if (debouncedTerm !== search.query) {
      setSearchParams(userSearchToUrl({ query: debouncedTerm, page: 1 }), { replace: true });
    }
  }, [debouncedTerm, search.query, setSearchParams]);

  const [users, retryUsers, updateUsers] = useAdminResource(
    (signal) => listAdminUsers({ query: search.query, page: search.page - 1, size: PAGE_SIZE }, signal),
    "Não foi possível carregar os usuários.",
    `${search.query}|${search.page}`,
  );

  const [currentOwnerId, setCurrentOwnerId] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    getWhoami()
      .then((whoami) => {
        if (!cancelled) setCurrentOwnerId(whoami.ownerId);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const [isSortedByCost, setIsSortedByCost] = useState(false);
  const [target, setTarget] = useState<{ user: AdminUser; action: AccountAction } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const goToPage = (page: number) => setSearchParams(userSearchToUrl({ query: search.query, page }));

  async function runAction(user: AdminUser, action: AccountAction) {
    const enabled = action === "enable";

    setTarget(null);
    setActionError(null);
    updateUsers((page) => applyEnabled(page, user.ownerId, enabled));

    try {
      await (enabled ? enableUser(user.ownerId) : disableUser(user.ownerId));
    } catch (error) {
      updateUsers((page) => applyEnabled(page, user.ownerId, user.enabled));
      setActionError(accountActionError(error));
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Usuários"
        description="Busque contas, veja o custo de cada uma e desative quem precisa perder o acesso."
      />

      <SearchField
        className="w-full md:max-w-md"
        aria-label="Buscar por nome de usuário ou e-mail"
        value={term}
        onChange={setTerm}
      >
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder="Começo do nome de usuário ou do e-mail" />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>

      {actionError !== null ? (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-xl bg-danger-soft p-3 text-sm text-danger">
          <span className="text-pretty">{actionError}</span>
          <Button size="sm" variant="ghost" onPress={() => setActionError(null)}>
            Fechar
          </Button>
        </div>
      ) : null}

      <section className="flex flex-col gap-3 rounded-2xl bg-surface p-4 shadow-surface">
        <AdminBlock resource={users} onRetry={retryUsers}>
          {(page) => {
            const pages = pageCount(page.total, page.size);
            const shown = isSortedByCost ? sortByCost(page.users) : page.users;

            if (page.users.length === 0 && search.page > 1 && page.total > 0) {
              return (
                <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
                  Esta página não existe mais.
                  <Button size="sm" variant="secondary" onPress={() => goToPage(1)}>
                    Voltar para a primeira página
                  </Button>
                </p>
              );
            }

            if (page.users.length === 0) {
              return (
                <p className="text-sm text-muted">
                  {search.query.length > 0
                    ? `Ninguém com nome de usuário ou e-mail começando com “${search.query}”.`
                    : "Nenhum usuário ainda."}
                </p>
              );
            }

            return (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-muted" aria-live="polite">
                    {countOf(page.total, "usuário encontrado", "usuários encontrados")}
                  </p>
                  <Button
                    size="sm"
                    variant={isSortedByCost ? "primary" : "secondary"}
                    aria-pressed={isSortedByCost}
                    onPress={() => setIsSortedByCost((sorted) => !sorted)}
                  >
                    Mais caros primeiro (nesta página)
                  </Button>
                </div>

                <AdminUsersList
                  users={shown}
                  usdBrlRate={page.usdBrlRate}
                  currentOwnerId={currentOwnerId}
                  onAction={(user, action) => setTarget({ user, action })}
                />

                {pages > 1 ? (
                  <nav aria-label="Páginas" className="flex items-center justify-between gap-2">
                    <Button size="sm" variant="secondary" isDisabled={search.page <= 1} onPress={() => goToPage(search.page - 1)}>
                      Anterior
                    </Button>
                    <span className="text-sm text-muted tabular-nums">
                      Página {Math.min(search.page, pages)} de {pages}
                    </span>
                    <Button size="sm" variant="secondary" isDisabled={search.page >= pages} onPress={() => goToPage(search.page + 1)}>
                      Próxima
                    </Button>
                  </nav>
                ) : null}

                <ExchangeRateNote usdBrlRate={page.usdBrlRate} />
              </>
            );
          }}
        </AdminBlock>
      </section>

      <DialogAccountAction target={target} onClose={() => setTarget(null)} onConfirm={runAction} />
    </>
  );
}
