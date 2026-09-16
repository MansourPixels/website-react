import { Button, Spinner } from "@heroui/react";
import type { ReactNode } from "react";

import { ErrorState } from "@/components/ErrorState";
import type { RankingEntry } from "@/types/api/ranking";

import { RankingRow } from "./RankingRow";

interface RankingListProps {
  entries: RankingEntry[] | null;
  error: string | null;
  /** Falha da paginação: mora abaixo do botão e não derruba a lista já carregada. */
  loadMoreError: string | null;
  hasMore: boolean;
  isLoadingMore: boolean;
  emptyState: ReactNode;
  onLoadMore: () => void;
  onRetry: () => void;
}

export function RankingList({
  entries,
  error,
  loadMoreError,
  hasMore,
  isLoadingMore,
  emptyState,
  onLoadMore,
  onRetry,
}: RankingListProps) {
  if (error !== null) {
    return <ErrorState onRetry={onRetry}>{error}</ErrorState>;
  }

  if (entries === null) {
    return (
      <div className="flex items-center justify-center py-10" aria-busy="true">
        <Spinner size="lg" />
        <span className="sr-only">Carregando ranking</span>
      </div>
    );
  }

  if (entries.length === 0) return <>{emptyState}</>;

  return (
    <div className="flex flex-col gap-4">
      <ol className="flex flex-col gap-2">
        {entries.map((entry) => (
          <RankingRow key={entry.user.id} entry={entry} />
        ))}
      </ol>

      {hasMore ? (
        <Button
          variant="secondary"
          className="mx-auto"
          isDisabled={isLoadingMore}
          onPress={onLoadMore}
        >
          {isLoadingMore ? "Carregando…" : "Carregar mais"}
        </Button>
      ) : null}

      {/* Sem botão próprio de retry: o "Carregar mais" acima continua ali e é
          exatamente a ação que falhou. */}
      {loadMoreError !== null ? (
        <ErrorState isCompact>{loadMoreError}</ErrorState>
      ) : null}
    </div>
  );
}
