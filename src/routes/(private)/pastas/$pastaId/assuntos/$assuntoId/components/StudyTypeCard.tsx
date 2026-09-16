import { buttonVariants, cn } from "@heroui/styles";
import type { LucideIcon } from "lucide-react";
import { Link, useParams } from "react-router";

interface StudyTypeCard {
  id: "flash-cards" | "resumo" | "simulado-prova" | "mapa-mental";
  name: string;
  description: string;
  icon: LucideIcon;
  iconClass?: string;
  to?: string;
}

export function StudyTypeCard({
  id,
  name,
  description,
  icon: Icon,
  iconClass,
  to,
}: StudyTypeCard) {
  const { pastaId, assuntoId } = useParams<"pastaId" | "assuntoId">() as {
    pastaId: string;
    assuntoId: string;
  };

  return (
    <Link
      to={to ?? `/pastas/${pastaId}/assuntos/${assuntoId}/${id}`}
      className={buttonVariants({
        className:
          "bg-surface rounded-xl shadow-surface px-5 py-4 flex items-center gap-4 h-auto w-full",
        variant: "ghost",
      })}
    >
      <div
        className={cn(
          "size-9 rounded-xl flex items-center justify-center text-white",
          iconClass,
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="flex-1">
        <h2 className="font-semibold">{name}</h2>
        <p className="text-xs text-muted font-normal whitespace-normal">
          {description}
        </p>
      </div>
    </Link>
  );
}
