import { buttonVariants } from "@heroui/styles";
import { Link, useParams } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

interface StudyTypeCard {
  id: "flash-cards" | "resumo" | "simulado-prova";
  name: string;
  description: string;
  icon: LucideIcon;
  iconClass?: string;
}

export function StudyTypeCard({
  id,
  name,
  description,
  icon: Icon,
  iconClass,
}: StudyTypeCard) {
  const params = useParams({ from: "/pastas/$pastaId/assuntos/$assuntoId/" });

  return (
    <Link
      to={`/pastas/$pastaId/assuntos/$assuntoId/${id}`}
      params={params}
      className={buttonVariants({
        className:
          "bg-white rounded-xl px-5 py-4 flex items-center gap-4 h-auto",
        variant: "ghost",
      })}
    >
      <div
        className={`size-9 rounded-xl flex items-center justify-center text-white ${iconClass}`}
      >
        <Icon className="size-5" />
      </div>
      <div className="flex-1">
        <h2 className="font-semibold">{name}</h2>
        <p className="text-xs text-zinc-500 font-normal whitespace-normal">
          {description}
        </p>
      </div>
    </Link>
  );
}
