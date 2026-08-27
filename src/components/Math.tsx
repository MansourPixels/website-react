interface MathProps {
  children: string;
}

// A API devolve question/optionA-D como texto puro, já com os símbolos
// matemáticos como caracteres unicode (², ₀, π, Δ, √...) — confirmado
// contra uma resposta real de GET .../quiz. Não há marcação LaTeX/markdown
// para parsear, então só exibimos a string como veio.
export function Math({ children }: MathProps) {
  return <span className="font-math">{children}</span>;
}
