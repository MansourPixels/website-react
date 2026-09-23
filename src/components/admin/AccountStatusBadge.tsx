import { cn } from "@heroui/react";

/** O estado da conta no Keycloak: "Ativa" em verde, "Desativada" em cinza. */
export function AccountStatusBadge({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium",
        enabled ? "bg-success-soft text-success" : "bg-default text-muted",
      )}
    >
      {enabled ? "Ativa" : "Desativada"}
    </span>
  );
}
