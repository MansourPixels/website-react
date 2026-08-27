import { Button } from "@heroui/react";
import { cn } from "@heroui/styles";
import {
  Background,
  BackgroundVariant,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import type { Edge, Node, NodeProps, NodeTypes } from "@xyflow/react";
import { ChevronDown, Maximize2, Minus, Plus } from "lucide-react";
import { createContext, useContext, useEffect, useMemo } from "react";

import { Math as MathText } from "@/components/Math";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { MindMapBranch } from "@/types/api/mindMap";
import type { MindMapPlacement } from "@/utils/mindMapLayout";

type MindMapNodeData = {
  label: string;
  detalhe?: string;
  formula?: string;
  depth: number;
  childCount: number;
  isExpanded: boolean;
};

type MindMapFlowNode = Node<MindMapNodeData, "mindMap">;

const ToggleContext = createContext<(id: string) => void>(() => {});

function MindMapNodeCard({ id, data }: NodeProps<MindMapFlowNode>) {
  const toggle = useContext(ToggleContext);
  const { label, detalhe, formula, depth, childCount, isExpanded } = data;

  const isRoot = depth === 0;
  const hasChildren = childCount > 0;

  return (
    <>
      {/* opacity-0 e não display:none: o React Flow precisa medir os handles. */}
      <Handle
        id="t-l"
        type="target"
        position={Position.Left}
        className="opacity-0 pointer-events-none"
      />
      <Handle
        id="t-r"
        type="target"
        position={Position.Right}
        className="opacity-0 pointer-events-none"
      />
      <Handle
        id="s-l"
        type="source"
        position={Position.Left}
        className="opacity-0 pointer-events-none"
      />
      <Handle
        id="s-r"
        type="source"
        position={Position.Right}
        className="opacity-0 pointer-events-none"
      />

      <button
        type="button"
        disabled={!hasChildren}
        onClick={() => toggle(id)}
        aria-expanded={hasChildren ? isExpanded : undefined}
        className={cn(
          // O React Flow marca .react-flow__node com pointer-events:none
          // (nodesFocusable/elementsSelectable estão off); sem isso o clique
          // atravessa o card e cai no pane.
          "mind-map-node pointer-events-auto size-full text-left rounded-xl shadow-surface px-3.5 py-3 overflow-hidden flex flex-col gap-1",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          isRoot ? "bg-cyan-600 text-white" : "bg-white border border-cyan-200",
          hasChildren && "cursor-pointer hover:brightness-105",
        )}
      >
        <span
          className={cn(
            "font-semibold leading-tight line-clamp-3",
            isRoot ? "text-base" : "text-sm",
          )}
        >
          {label}
        </span>

        {formula !== undefined ? (
          <span
            className={cn("text-sm", isRoot ? "opacity-90" : "text-cyan-800")}
          >
            <MathText>{formula}</MathText>
          </span>
        ) : null}

        {detalhe !== undefined ? (
          <span
            className={cn(
              "text-xs leading-tight line-clamp-2",
              isRoot ? "opacity-90" : "text-zinc-500",
            )}
          >
            {detalhe}
          </span>
        ) : null}

        {hasChildren && !isExpanded ? (
          <span
            className={cn(
              "mt-auto flex items-center gap-1 text-xs font-medium",
              isRoot ? "opacity-90" : "text-cyan-700",
            )}
          >
            <ChevronDown className="size-3.5" />
            {childCount === 1 ? "1 ramo" : `${childCount} ramos`}
          </span>
        ) : null}
      </button>
    </>
  );
}

const nodeTypes: NodeTypes = { mindMap: MindMapNodeCard };

const defaultEdgeOptions = {
  type: "smoothstep",
  style: { stroke: "var(--color-cyan-600)", strokeWidth: 2 },
};

function BranchOutline({ branch }: { branch: MindMapBranch }) {
  return (
    <li>
      {branch.label}
      {branch.formula !== undefined ? `. ${branch.formula}` : ""}
      {branch.detalhe !== undefined ? `. ${branch.detalhe}` : ""}
      {branch.children !== undefined ? (
        <ol>
          {branch.children.map((child) => (
            <BranchOutline key={child.id} branch={child} />
          ))}
        </ol>
      ) : null}
    </li>
  );
}

interface MindMapCanvasProps {
  root: MindMapBranch;
  placements: MindMapPlacement[];
  onToggle: (id: string) => void;
  /** Muda para pedir um reenquadramento do mapa. */
  fitKey: number;
  /** Fora da página do modo o canvas não captura pan nem zoom. */
  isInteractive?: boolean;
  className?: string;
}

type MindMapFlowProps = Omit<MindMapCanvasProps, "onToggle" | "className">;

function MindMapFlow({
  root,
  placements,
  fitKey,
  isInteractive = true,
}: MindMapFlowProps) {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const nodes = useMemo<MindMapFlowNode[]>(
    () =>
      placements.map((placement) => ({
        id: placement.branch.id,
        type: "mindMap",
        position: { x: placement.x, y: placement.y },
        width: placement.width,
        height: placement.height,
        data: {
          label: placement.branch.label,
          detalhe: placement.branch.detalhe,
          formula: placement.branch.formula,
          depth: placement.depth,
          childCount: placement.childCount,
          isExpanded: placement.isExpanded,
        },
      })),
    [placements],
  );

  const edges = useMemo<Edge[]>(
    () =>
      placements.flatMap((placement) =>
        placement.parentId === null
          ? []
          : [
              {
                id: `${placement.parentId}-${placement.branch.id}`,
                source: placement.parentId,
                target: placement.branch.id,
                sourceHandle: placement.side === "right" ? "s-r" : "s-l",
                targetHandle: placement.side === "right" ? "t-l" : "t-r",
              },
            ],
      ),
    [placements],
  );

  // O reenquadramento espera um frame: o store do React Flow só conhece os
  // nós novos depois do commit.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      fitView({
        padding: 0.2,
        maxZoom: 1,
        duration: prefersReducedMotion ? 0 : 400,
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [fitKey, fitView, prefersReducedMotion]);

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        minZoom={0.2}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        elementsSelectable={false}
        zoomOnDoubleClick={false}
        panOnDrag={isInteractive}
        zoomOnScroll={isInteractive}
        zoomOnPinch={isInteractive}
        preventScrolling={isInteractive}
        deleteKeyCode={null}
        selectionKeyCode={null}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          color="var(--color-cyan-300)"
        />
      </ReactFlow>

      {isInteractive ? (
        <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1 rounded-xl bg-white p-1 shadow-surface">
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label="Aproximar"
            onPress={() => zoomIn({ duration: 200 })}
          >
            <Plus />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label="Afastar"
            onPress={() => zoomOut({ duration: 200 })}
          >
            <Minus />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label="Enquadrar o mapa"
            onPress={() => fitView({ padding: 0.2, maxZoom: 1, duration: 300 })}
          >
            <Maximize2 />
          </Button>
        </div>
      ) : null}

      {/* O canvas é opaco para leitor de tela; o índice abaixo é a árvore inteira. */}
      <ol className="sr-only">
        <BranchOutline branch={root} />
      </ol>
    </>
  );
}

export function MindMapCanvas({
  onToggle,
  className,
  ...flow
}: MindMapCanvasProps) {
  return (
    <ToggleContext.Provider value={onToggle}>
      <div className={cn("relative size-full", className)}>
        <ReactFlowProvider>
          <MindMapFlow {...flow} />
        </ReactFlowProvider>
      </div>
    </ToggleContext.Provider>
  );
}
