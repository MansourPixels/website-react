import { describe, expect, it } from "vitest";

import type { MindMapBranch } from "@/types/api/mindMap";
import {
  collectBranchIds,
  layoutMindMap,
  MIND_MAP_NODE_WIDTH,
  MIND_MAP_ROOT_WIDTH,
  mindMapNodeWidth,
} from "./mindMapLayout";

function branch(id: string, children: MindMapBranch[] = []): MindMapBranch {
  return { id, label: id, children };
}

describe("mindMapNodeWidth", () => {
  it("usa a largura da raiz só na profundidade 0", () => {
    expect(mindMapNodeWidth(0)).toBe(MIND_MAP_ROOT_WIDTH);
    expect(mindMapNodeWidth(1)).toBe(MIND_MAP_NODE_WIDTH);
    expect(mindMapNodeWidth(2)).toBe(MIND_MAP_NODE_WIDTH);
  });
});

describe("collectBranchIds", () => {
  it("coleta o id de todo mundo na árvore, recursivamente", () => {
    const root = branch("raiz", [
      branch("a", [branch("a1")]),
      branch("b"),
    ]);

    expect([...collectBranchIds(root, new Set())].sort()).toEqual(
      ["a", "a1", "b", "raiz"].sort(),
    );
  });
});

describe("layoutMindMap", () => {
  it("posiciona só a raiz quando ela não está expandida", () => {
    const root = branch("raiz", [branch("filho")]);
    const placements = layoutMindMap({ root, expanded: new Set() });

    expect(placements).toHaveLength(1);
    expect(placements[0].branch.id).toBe("raiz");
    expect(placements[0].depth).toBe(0);
    expect(placements[0].isExpanded).toBe(false);
  });

  it("posiciona raiz + filhos quando a raiz está expandida", () => {
    const root = branch("raiz", [branch("a"), branch("b")]);
    const placements = layoutMindMap({ root, expanded: new Set(["raiz"]) });

    expect(placements.map((p) => p.branch.id).sort()).toEqual(["a", "b", "raiz"].sort());

    const [a, b] = placements.filter((p) => p.depth === 1);
    expect(a.side).not.toBe(b.side); // um ramo em cada lado
  });

  it("não expande netos quando só o filho direto está no set", () => {
    const root = branch("raiz", [branch("a", [branch("a1")])]);
    const placements = layoutMindMap({ root, expanded: new Set(["raiz"]) });

    expect(placements.some((p) => p.branch.id === "a1")).toBe(false);
  });

  it("expande netos quando o filho também está no set", () => {
    const root = branch("raiz", [branch("a", [branch("a1")])]);
    const placements = layoutMindMap({
      root,
      expanded: new Set(["raiz", "a"]),
    });

    expect(placements.some((p) => p.branch.id === "a1")).toBe(true);
  });

  it("não sobrepõe irmãos no mesmo lado (blocos verticais exclusivos)", () => {
    const root = branch("raiz", [
      branch("a"),
      branch("b"),
      branch("c"),
      branch("d"),
    ]);
    const placements = layoutMindMap({ root, expanded: new Set(["raiz"]) });

    const bySide = new Map<string, { top: number; bottom: number }[]>();
    for (const p of placements) {
      if (p.depth !== 1) continue;

      const list = bySide.get(p.side) ?? [];
      list.push({ top: p.y, bottom: p.y + p.height });
      bySide.set(p.side, list);
    }

    for (const ranges of bySide.values()) {
      const sorted = [...ranges].sort((a, b) => a.top - b.top);
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].top).toBeGreaterThanOrEqual(sorted[i - 1].bottom);
      }
    }
  });

  it("usa a altura de measure() no lugar da estimativa quando fornecida", () => {
    const root = branch("raiz");
    const placements = layoutMindMap({
      root,
      expanded: new Set(),
      measure: (id) => (id === "raiz" ? 999 : undefined),
    });

    expect(placements[0].height).toBe(999);
  });
});
