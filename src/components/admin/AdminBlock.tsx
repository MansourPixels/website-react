import { Spinner } from "@heroui/react";
import type { ReactNode } from "react";

import { ErrorState } from "@/components/ErrorState";
import type { AdminResource } from "@/hooks/useAdminResource";

/** Mostra o carregamento, o erro com "Tentar novamente" ou o conteúdo de um bloco de admin. */
export function AdminBlock<T>({
  resource,
  onRetry,
  children,
}: {
  resource: AdminResource<T>;
  onRetry: () => void;
  children: (value: T) => ReactNode;
}) {
  if (resource.state === "loading") {
    return (
      <div className="flex justify-center py-6" aria-busy="true">
        <Spinner size="sm" />
      </div>
    );
  }

  if (resource.state === "error") {
    return (
      <ErrorState isCompact onRetry={onRetry}>
        {resource.message}
      </ErrorState>
    );
  }

  return <>{children(resource.value)}</>;
}
