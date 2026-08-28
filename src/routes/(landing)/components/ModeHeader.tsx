import { cn } from "@heroui/react";
import type { LucideIcon } from "lucide-react";

interface ModeHeaderProps {
  icon: LucideIcon;
  iconClass: string;
  name: string;
  description: string;
}

export function ModeHeader({
  icon: Icon,
  iconClass,
  name,
  description,
}: ModeHeaderProps) {
  return (
    <header className="flex items-center gap-4">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl text-white",
          iconClass,
        )}
      >
        <Icon className="size-5" />
      </div>
      <div>
        <h3 className="font-semibold">{name}</h3>
        <p className="text-xs text-muted">{description}</p>
      </div>
    </header>
  );
}
