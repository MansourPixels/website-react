import type { ReactNode } from "react";

interface MathProps {
  children: ReactNode;
}

export function Math({ children }: MathProps) {
  // @ts-ignore
  return <math className="font-math">{children}</math>;
}
