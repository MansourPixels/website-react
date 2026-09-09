import { Button, Spinner } from "@heroui/react";
import type { ReactNode } from "react";

import type { RankingEntry } from "@/types/api/ranking";

import { RankingRow } from "./RankingRow";

interface RankingListProps {
  entries: RankingEntry[] | null;
  error: string | null;
  hasMore: boolean;
  isLoadingMore: boolean;
  emptyState: ReactNode;
  onLoadMore: () => void;
}

export function RankingList({
  entries,
  error,
  hasMore,
  isLoadingMore,
  emptyState,
  onLoadMore,
}: RankingListProps) {
  if (error !== null) {
    return <p className="text-danger py-8 text-center">{error}</p>;
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
    </div>
  );
}
