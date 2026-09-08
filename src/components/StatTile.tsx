import { cn } from "@heroui/react";
import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";

interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  delta?: number;
  deltaLabel?: string;
  deltaSuffix?: string;
  icon?: LucideIcon;
  className?: string;
}

export function StatTile({
  label,
  value,
  hint,
  delta,
  deltaLabel = "vs. semana anterior",
  deltaSuffix = "",
  icon: Icon,
  className,
}: StatTileProps) {
  const isPositive = (delta ?? 0) >= 0;
  const DeltaIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <article
      className={cn(
        "bg-surface rounded-2xl shadow-surface p-4 flex flex-col gap-1",
        className,
      )}
    >
      <header className="flex items-start gap-2 text-muted text-sm min-h-10 sm:min-h-0">
        {Icon ? <Icon className="size-4 shrink-0 mt-0.5" /> : null}
        <h3 className="line-clamp-2 text-pretty">{label}</h3>
      </header>

      <strong className="text-2xl sm:text-3xl font-semibold tabular-nums">
        {value}
      </strong>

      {delta !== undefined ? (
        <p
          className={cn(
            "flex items-start gap-1 text-sm text-pretty",
            isPositive ? "text-success" : "text-danger",
          )}
        >
          <DeltaIcon className="size-4 shrink-0 mt-0.5" />
          <span className="tabular-nums">
            {isPositive ? "+" : "−"}
            {Math.abs(delta)}
            {deltaSuffix} {deltaLabel}
          </span>
        </p>
      ) : hint ? (
        <p className="text-muted text-sm text-pretty">{hint}</p>
      ) : null}
    </article>
  );
}
