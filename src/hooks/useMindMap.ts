import { useCallback, useEffect, useMemo, useState } from "react";

import type { MindMapBranch } from "@/types/api/mindMap";
import {
  collectBranchIds,
  layoutMindMap,
  type MindMapPlacement,
} from "@/utils/mindMapLayout";

function seedExpanded(root: MindMapBranch | null) {
  return root === null ? new Set<string>() : new Set([root.id]);
}

function seedRevealed(root: MindMapBranch | null) {
  if (root === null) return new Set<string>();

  const seed = new Set([root.id]);
  for (const child of root.children ?? []) seed.add(child.id);

  return seed;
}

export interface MindMapState {
  placements: MindMapPlacement[];
  revealedCount: number;
  total: number;
  isComplete: boolean;
  toggle: (id: string) => void;
  expandAll: () => void;
  reset: () => void;
}

/**
 * Dois conjuntos com papéis diferentes: `expanded` governa o que aparece,
 * `revealed` governa o progresso e só cresce. Se a barra medisse os nós
 * visíveis, colapsar um ramo faria o progresso andar para trás.
 */
export function useMindMap(root: MindMapBranch | null): MindMapState {
  const [expanded, setExpanded] = useState(() => seedExpanded(root));
  const [revealed, setRevealed] = useState(() => seedRevealed(root));
  const [seededId, setSeededId] = useState(root?.id ?? null);

  // Na página do modo a árvore chega depois, pela promise da Revi IA.
  useEffect(() => {
    if (root === null || root.id === seededId) return;

    setExpanded(seedExpanded(root));
    setRevealed(seedRevealed(root));
    setSeededId(root.id);
  }, [root, seededId]);

  const byId = useMemo(() => {
    const index = new Map<string, MindMapBranch>();

    function walk(branch: MindMapBranch) {
      index.set(branch.id, branch);
      for (const child of branch.children ?? []) walk(child);
    }

    if (root !== null) walk(root);

    return index;
  }, [root]);

  const total = useMemo(
    () => (root === null ? 0 : collectBranchIds(root, new Set()).size),
    [root],
  );

  const toggle = useCallback(
    (id: string) => {
      const children = byId.get(id)?.children ?? [];
      if (children.length === 0) return;

      const isOpening = !expanded.has(id);

      setExpanded((previous) => {
        const next = new Set(previous);

        if (isOpening) next.add(id);
        else next.delete(id);

        return next;
      });

      if (!isOpening) return;

      setRevealed((previous) => {
        const next = new Set(previous);
        for (const child of children) next.add(child.id);

        return next;
      });
    },
    [byId, expanded],
  );

  const expandAll = useCallback(() => {
    if (root === null) return;

    const all = collectBranchIds(root, new Set());
    setExpanded(all);
    setRevealed(all);
  }, [root]);

  const reset = useCallback(() => {
    setExpanded(seedExpanded(root));
    setRevealed(seedRevealed(root));
  }, [root]);

  const placements = useMemo(
    () => (root === null ? [] : layoutMindMap({ root, expanded })),
    [root, expanded],
  );

  return {
    placements,
    revealedCount: revealed.size,
    total,
    isComplete: total > 0 && revealed.size === total,
    toggle,
    expandAll,
    reset,
  };
}
