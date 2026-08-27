import type { MindMapBranch } from "@/mocks/mindMap";

export const MIND_MAP_ROOT_WIDTH = 232;
export const MIND_MAP_NODE_WIDTH = 208;
export const MIND_MAP_COLUMN_GAP = 64;
export const MIND_MAP_ROW_GAP = 16;

/**
 * A altura do card é ditada por estes números, não medida pelo navegador:
 * o layout escreve `height` no nó e o card usa `line-clamp` com os mesmos
 * limites. Isso dispensa um segundo passo de layout a cada expansão.
 */
const PADDING_Y = 24;
const PADDING_X = 30;
const LABEL_LINE_HEIGHT = 18;
const LABEL_MAX_LINES = 3;
const LABEL_CHAR_WIDTH = 7.2;
const FORMULA_LINE_HEIGHT = 22;
const DETAIL_LINE_HEIGHT = 16;
const DETAIL_MAX_LINES = 2;
const DETAIL_CHAR_WIDTH = 6;
const CHIP_HEIGHT = 24;
const MIN_NODE_HEIGHT = 46;

export type MindMapSide = "left" | "right";

export interface MindMapPlacement {
  branch: MindMapBranch;
  parentId: string | null;
  depth: number;
  side: MindMapSide;
  x: number;
  y: number;
  width: number;
  height: number;
  childCount: number;
  isExpanded: boolean;
}

export function mindMapNodeWidth(depth: number) {
  return depth === 0 ? MIND_MAP_ROOT_WIDTH : MIND_MAP_NODE_WIDTH;
}

function countLines(
  text: string,
  width: number,
  charWidth: number,
  maxLines: number,
) {
  const charsPerLine = Math.max(1, Math.floor((width - PADDING_X) / charWidth));

  return Math.min(maxLines, Math.max(1, Math.ceil(text.length / charsPerLine)));
}

export function estimateNodeHeight(
  branch: MindMapBranch,
  depth: number,
  isExpanded: boolean,
) {
  const width = mindMapNodeWidth(depth);
  const childCount = branch.children?.length ?? 0;

  let height =
    PADDING_Y +
    countLines(branch.label, width, LABEL_CHAR_WIDTH, LABEL_MAX_LINES) *
      LABEL_LINE_HEIGHT;

  if (branch.formula !== undefined) height += FORMULA_LINE_HEIGHT;

  if (branch.detalhe !== undefined) {
    height +=
      countLines(branch.detalhe, width, DETAIL_CHAR_WIDTH, DETAIL_MAX_LINES) *
      DETAIL_LINE_HEIGHT;
  }

  if (childCount > 0 && !isExpanded) height += CHIP_HEIGHT;

  return Math.max(MIN_NODE_HEIGHT, height);
}

function columnX(depth: number, side: MindMapSide) {
  if (depth === 0) return -MIND_MAP_ROOT_WIDTH / 2;

  const stride = MIND_MAP_NODE_WIDTH + MIND_MAP_COLUMN_GAP;
  const outward =
    MIND_MAP_ROOT_WIDTH / 2 + MIND_MAP_COLUMN_GAP + (depth - 1) * stride;

  return side === "right" ? outward : -outward - MIND_MAP_NODE_WIDTH;
}

interface LayoutMindMapInput {
  root: MindMapBranch;
  expanded: ReadonlySet<string>;
  /** Gancho para altura medida de verdade. Não usado hoje. */
  measure?: (id: string) => number | undefined;
}

interface SubtreeSize {
  /** Altura do próprio card. */
  own: number;
  /** Altura do bloco vertical que a subtree inteira reserva. */
  total: number;
}

/**
 * Layout de mapa mental clássico: raiz no centro, ramos de nível 1 divididos
 * entre esquerda e direita, subárvores empilhadas sem sobreposição.
 *
 * Cada nó recebe um intervalo vertical exclusivo `[topo, topo + total)`. Os
 * filhos fatiam esse intervalo em sequência e o card do próprio nó se centra
 * nele. Como `total = max(own, stack)`, um pai alto com filho único também
 * cabe no próprio bloco em vez de vazar para o do irmão de cima.
 */
export function layoutMindMap({
  root,
  expanded,
  measure,
}: LayoutMindMapInput): MindMapPlacement[] {
  const sizes = new Map<string, SubtreeSize>();
  const placements: MindMapPlacement[] = [];

  function measureSubtree(branch: MindMapBranch, depth: number) {
    const isExpanded = expanded.has(branch.id);
    const own =
      measure?.(branch.id) ?? estimateNodeHeight(branch, depth, isExpanded);
    const children = isExpanded ? (branch.children ?? []) : [];

    let stack = children.length > 1 ? MIND_MAP_ROW_GAP * (children.length - 1) : 0;
    for (const child of children) stack += measureSubtree(child, depth + 1);

    const size: SubtreeSize = { own, total: Math.max(own, stack) };
    sizes.set(branch.id, size);

    return size.total;
  }

  function stackHeight(children: MindMapBranch[]) {
    let stack = MIND_MAP_ROW_GAP * (children.length - 1);
    for (const child of children) stack += sizes.get(child.id)?.total ?? 0;

    return stack;
  }

  function place(
    branch: MindMapBranch,
    depth: number,
    side: MindMapSide,
    parentId: string | null,
    blockTop: number,
  ) {
    const size = sizes.get(branch.id);
    if (size === undefined) return;

    const children = branch.children ?? [];
    const isExpanded = expanded.has(branch.id);

    placements.push({
      branch,
      parentId,
      depth,
      side,
      x: columnX(depth, side),
      y: blockTop + (size.total - size.own) / 2,
      width: mindMapNodeWidth(depth),
      height: size.own,
      childCount: children.length,
      isExpanded,
    });

    if (!isExpanded || children.length === 0) return;

    let cursor = blockTop + (size.total - stackHeight(children)) / 2;

    for (const child of children) {
      place(child, depth + 1, side, branch.id, cursor);
      cursor += (sizes.get(child.id)?.total ?? 0) + MIND_MAP_ROW_GAP;
    }
  }

  measureSubtree(root, 0);

  const rootSize = sizes.get(root.id);
  if (rootSize === undefined) return placements;

  placements.push({
    branch: root,
    parentId: null,
    depth: 0,
    side: "right",
    x: columnX(0, "right"),
    y: -rootSize.own / 2,
    width: MIND_MAP_ROOT_WIDTH,
    height: rootSize.own,
    childCount: root.children?.length ?? 0,
    isExpanded: expanded.has(root.id),
  });

  if (!expanded.has(root.id)) return placements;

  // Dividir os ramos ao meio deixaria uma coluna bem mais alta que a outra
  // quando as subárvores têm tamanhos diferentes. Atribui o ramo mais alto
  // primeiro, sempre ao lado mais curto, e depois devolve a ordem original
  // dentro de cada lado para a leitura de cima para baixo se manter.
  const branches = root.children ?? [];
  const weightOf = (branch: MindMapBranch) => sizes.get(branch.id)?.total ?? 0;

  const rightIds = new Set<string>();
  let rightWeight = 0;
  let leftWeight = 0;

  for (const child of [...branches].sort((a, b) => weightOf(b) - weightOf(a))) {
    if (rightWeight <= leftWeight) {
      rightIds.add(child.id);
      rightWeight += weightOf(child);
    } else {
      leftWeight += weightOf(child);
    }
  }

  const sides: [MindMapSide, MindMapBranch[]][] = [
    ["right", branches.filter((child) => rightIds.has(child.id))],
    ["left", branches.filter((child) => !rightIds.has(child.id))],
  ];

  // Cada lado é empilhado e centrado de forma independente em y = 0.
  for (const [side, group] of sides) {
    if (group.length === 0) continue;

    let cursor = -stackHeight(group) / 2;

    for (const child of group) {
      place(child, 1, side, root.id, cursor);
      cursor += (sizes.get(child.id)?.total ?? 0) + MIND_MAP_ROW_GAP;
    }
  }

  return placements;
}

export function collectBranchIds(branch: MindMapBranch, into: Set<string>) {
  into.add(branch.id);
  for (const child of branch.children ?? []) collectBranchIds(child, into);

  return into;
}
