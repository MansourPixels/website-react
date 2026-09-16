import { Button } from "@heroui/react";
import { cn } from "@heroui/styles";
import type { ReactNode } from "react";

interface ErrorStateProps {
  children: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  isCompact?: boolean;
}

// `danger-soft-foreground` em vez de `danger`: o vermelho cheio só alcança
// ~3,3:1 sobre a mesa no tema claro, e boa parte destes blocos vive fora de
// um cartão. O token misturado escurece no claro e clareia no escuro.
export function ErrorState({
  children,
  onRetry,
  retryLabel = "Tentar novamente",
  isCompact = false,
}: ErrorStateProps) {
  const message = (
    <p
      className={cn(
        "text-danger-soft-foreground text-center text-pretty",
        isCompact && "text-sm",
      )}
    >
      {children}
    </p>
  );

  if (onRetry === undefined) {
    return (
      <div role="alert" className={isCompact ? "py-4" : "py-8"}>
        {message}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3",
        isCompact ? "py-4" : "py-8",
      )}
    >
      {message}
      <Button variant="secondary" size="sm" onPress={onRetry}>
        {retryLabel}
      </Button>
    </div>
  );
}
