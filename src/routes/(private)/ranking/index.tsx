import { Spinner, Tabs } from "@heroui/react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";

import { ApiError } from "@/api/client";
import { listClassrooms } from "@/api/classrooms";
import {
  getPreviousChampion,
  getRanking,
  getRankingSummary,
  type RankingQuery,
} from "@/api/ranking";
import { EmptyState } from "@/components/EmptyState";
import { NavMenu } from "@/components/NavMenu";
import type { Classroom } from "@/types/api/classroom";
import type {
  RankingEntry,
  RankingScope,
  RankingSummary,
  SeasonChampion,
} from "@/types/api/ranking";
import { pageMeta } from "@/utils/pageMeta";
import { buttonVariants } from "@heroui/styles";

import { ChampionCard } from "./components/ChampionCard";
import { ClassroomScopePicker } from "./components/ClassroomScopePicker";
import { RankingList } from "./components/RankingList";
import { SeasonSummary } from "./components/SeasonSummary";

export function meta() {
  return pageMeta({
    title: "Ranking",
    description:
      "Como você está em relação aos seus amigos e às suas turmas no tempo estudado.",
  });
}

const PAGE_SIZE = 20;

const scopeTabs = [
  { id: "global", label: "Global" },
  { id: "friends", label: "Amigos" },
  { id: "classroom", label: "Turma" },
] as const;

export default function RankingPage() {
  const [scope, setScope] = useState<RankingScope>("global");
  const [classrooms, setClassrooms] = useState<Classroom[] | null>(null);
  const [classroomId, setClassroomId] = useState<string | null>(null);

  const [entries, setEntries] = useState<RankingEntry[] | null>(null);
  const [summary, setSummary] = useState<RankingSummary | null>(null);
  const [champion, setChampion] = useState<SeasonChampion | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    listClassrooms()
      .then((result) => {
        if (cancelled) return;

        setClassrooms(result);
        setClassroomId(result[0]?.id ?? null);
      })
      .catch(() => {
        // A lista de turmas só alimenta a terceira aba: uma falha aqui não
        // pode derrubar o ranking global, que é o que a página abre mostrando.
        if (!cancelled) setClassrooms([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const buildQuery = useCallback((): RankingQuery | null => {
    if (scope !== "classroom") return { scope, page: 1, pageSize: PAGE_SIZE };
    if (classroomId === null) return null;

    return { scope, classroomId, page: 1, pageSize: PAGE_SIZE };
  }, [scope, classroomId]);

  useEffect(() => {
    const query = buildQuery();

    if (query === null) {
      setEntries([]);
      setSummary(null);
      setChampion(null);
      setHasMore(false);
      setError(null);
      setLoadMoreError(null);
      return;
    }

    let cancelled = false;

    // Campeão e resumo pertencem ao escopo antigo: mantê-los na tela enquanto o
    // novo carrega mostraria o campeão errado por alguns instantes.
    setEntries(null);
    setSummary(null);
    setChampion(null);
    setError(null);
    setLoadMoreError(null);
    setPage(1);

    Promise.all([
      getRanking(query),
      getRankingSummary(query),
      getPreviousChampion(query),
    ])
      .then(([rankingPage, rankingSummary, previousChampion]) => {
        if (cancelled) return;

        setEntries(rankingPage.entries);
        setHasMore(rankingPage.hasMore);
        setSummary(rankingSummary);
        setChampion(previousChampion);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;

        setError(
          loadError instanceof ApiError
            ? loadError.detail
            : "Não foi possível carregar o ranking. Tente novamente.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [buildQuery, reloadKey]);

  async function handleLoadMore() {
    const query = buildQuery();

    if (query === null || isLoadingMore) return;

    setIsLoadingMore(true);
    setLoadMoreError(null);

    try {
      const next = await getRanking({ ...query, page: page + 1 });

      setEntries((current) => [...(current ?? []), ...next.entries]);
      setHasMore(next.hasMore);
      setPage(page + 1);
    } catch (loadError) {
      // Erro próprio da paginação: o `error` da tela apagaria as posições já
      // carregadas, que continuam válidas.
      setLoadMoreError(
        loadError instanceof ApiError
          ? loadError.detail
          : "Não foi possível carregar mais posições. Tente novamente.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  // O vazio de "Turma" ramifica pela existência de turma, não pela lista vazia:
  // quem tem turma onde ninguém pontuou não recebe "você não participa de
  // nenhuma turma".
  const emptyState =
    scope === "friends" ? (
      <EmptyState
        action={
          <Link
            to="/amigos"
            className={buttonVariants({ variant: "secondary" })}
          >
            Encontrar amigos
          </Link>
        }
      >
        Você ainda não tem amigos para comparar. Adicione alguém e volte aqui.
      </EmptyState>
    ) : scope === "classroom" ? (
      classrooms === null ? null : classrooms.length === 0 ? (
        <EmptyState
          action={
            <Link
              to="/turmas"
              className={buttonVariants({ variant: "secondary" })}
            >
              Ver turmas
            </Link>
          }
        >
          Você ainda não participa de nenhuma turma. Crie ou entre em uma para
          disputar o ranking com a sua sala.
        </EmptyState>
      ) : (
        <EmptyState>
          Ninguém desta turma pontuou nesta temporada ainda.
        </EmptyState>
      )
    ) : (
      <EmptyState>Ninguém pontuou nesta temporada ainda.</EmptyState>
    );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 md:p-8">
      <NavMenu title="Ranking" hasBackButton backHref="/turmas" />

      {summary !== null ? <SeasonSummary summary={summary} /> : null}

      <Tabs
        selectedKey={scope}
        onSelectionChange={(key) => setScope(key as RankingScope)}
      >
        <Tabs.ListContainer>
          <Tabs.List aria-label="Escopo do ranking">
            {scopeTabs.map(({ id, label }) => (
              <Tabs.Tab key={id} id={id}>
                {label}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>

        {scopeTabs.map(({ id }) => (
          <Tabs.Panel
            key={id}
            id={id}
            className="flex flex-col gap-4 pt-4"
          >
            {id === "classroom" ? (
              classrooms === null ? (
                <div
                  className="flex items-center justify-center py-6"
                  aria-busy="true"
                >
                  <Spinner size="sm" />
                  <span className="sr-only">Carregando suas turmas</span>
                </div>
              ) : classrooms.length > 0 && classroomId !== null ? (
                <ClassroomScopePicker
                  classrooms={classrooms}
                  value={classroomId}
                  onChange={setClassroomId}
                />
              ) : null
            ) : null}

            {champion !== null ? <ChampionCard champion={champion} /> : null}

            <RankingList
              entries={entries}
              error={error}
              loadMoreError={loadMoreError}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              emptyState={emptyState}
              onLoadMore={handleLoadMore}
              onRetry={() => setReloadKey((key) => key + 1)}
            />
          </Tabs.Panel>
        ))}
      </Tabs>
    </main>
  );
}
