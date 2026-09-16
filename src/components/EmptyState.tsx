import { cn } from "@heroui/styles";
import type { ReactNode } from "react";

interface EmptyStateProps {
  children: ReactNode;
  // Quando o vazio tem saída, a mensagem ganha a ação abaixo dela e o bloco
  // vira coluna centrada. Sem ação, é só o parágrafo.
  action?: ReactNode;
  isCompact?: boolean;
}

export function EmptyState({
  children,
  action,
  isCompact = false,
}: EmptyStateProps) {
  if (action === undefined) {
    return (
      <p
        className={cn(
          "text-muted text-center text-pretty",
          isCompact ? "py-4 text-sm" : "py-8",
        )}
      >
        {children}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3",
        isCompact ? "py-4" : "py-8",
      )}
    >
      <p
        className={cn(
          "text-muted text-center text-pretty",
          isCompact && "text-sm",
        )}
      >
        {children}
      </p>
      {action}
    </div>
  );
}
