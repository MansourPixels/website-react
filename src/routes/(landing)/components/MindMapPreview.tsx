const branches = [
  { label: "Coeficientes", side: "left", y: 30 },
  { label: "Natureza das raízes", side: "left", y: 158 },
  { label: "Relações de Girard", side: "right", y: 30 },
  { label: "Como resolver", side: "right", y: 158 },
] as const;

const BRANCH_WIDTH = 176;
const BRANCH_HEIGHT = 46;
const LEFT_X = 24;
const RIGHT_X = 424;

/**
 * Vitrine estática do modo. A landing é rota pública, então nada de React
 * Flow aqui: montá-lo puxaria o canvas para o bundle da home e o faria
 * renderizar no servidor sem DOM.
 */
export function MindMapPreview() {
  return (
    <svg
      viewBox="0 0 624 234"
      className="h-auto w-full"
      role="img"
      aria-label="Prévia de um mapa mental sobre equação do terceiro grau, com a raiz no centro e quatro ramos ao redor."
    >
      {branches.map(({ label, side, y }) => {
        const isRight = side === "right";
        const cardX = isRight ? RIGHT_X : LEFT_X;
        const rootEdgeX = isRight ? 388 : 236;
        const branchEdgeX = isRight ? RIGHT_X : LEFT_X + BRANCH_WIDTH;
        const midX = (rootEdgeX + branchEdgeX) / 2;
        const branchY = y + BRANCH_HEIGHT / 2;

        return (
          <g key={label}>
            <path
              d={`M${rootEdgeX} 117 C${midX} 117, ${midX} ${branchY}, ${branchEdgeX} ${branchY}`}
              fill="none"
              stroke="var(--color-cyan-600)"
              strokeWidth="2"
            />
            <rect
              x={cardX}
              y={y}
              width={BRANCH_WIDTH}
              height={BRANCH_HEIGHT}
              rx="12"
              fill="white"
              stroke="var(--color-cyan-200)"
            />
            <text
              x={cardX + 16}
              y={y + 21}
              className="fill-foreground dark:fill-background text-sm font-semibold"
            >
              {label}
            </text>
            <text
              x={cardX + 16}
              y={y + 37}
              className="fill-cyan-700 text-xs font-medium"
            >
              3 ramos
            </text>
          </g>
        );
      })}

      <rect x="236" y="93" width="152" height="48" rx="14" fill="var(--color-cyan-600)" />
      <text
        x="312"
        y="113"
        textAnchor="middle"
        className="fill-white text-sm font-semibold"
      >
        Equação do 3º grau
      </text>
      <text
        x="312"
        y="130"
        textAnchor="middle"
        className="fill-white/90 font-math text-xs"
      >
        ax³ + bx² + cx + d = 0
      </text>
    </svg>
  );
}
