import type { StreakTodayChecklist } from "@/types/api/streak";
import { cn } from "@heroui/react";
import { Camera, Check, FileText, ListCheck, Zap, type LucideIcon } from "lucide-react";
import { Link } from "react-router";

interface ChecklistItem {
  key: keyof StreakTodayChecklist;
  label: string;
  icon: LucideIcon;
  // Para onde o item pendente leva. Só a captura tem rota própria; resumo,
  // flash cards e simulado vivem dentro de um assunto, então o caminho
  // honesto é a lista de pastas, onde o aluno escolhe o material.
  href: string;
}

const items: ChecklistItem[] = [
  { key: "upload", label: "Enviar material", icon: Camera, href: "/capturar" },
  { key: "summary", label: "Ler um resumo", icon: FileText, href: "/pastas" },
  {
    key: "flashcards",
    label: "Revisar flash cards",
    icon: Zap,
    href: "/pastas",
  },
  { key: "quiz", label: "Fazer um simulado", icon: ListCheck, href: "/pastas" },
];

interface TodayChecklistProps {
  today: StreakTodayChecklist;
  isGold: boolean;
}

export function TodayChecklist({ today, isGold }: TodayChecklistProps) {
  return (
    <section className="bg-surface rounded-3xl shadow-surface p-4 flex flex-col gap-3">
      <header className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">Checklist de hoje</h2>
        {isGold ? (
          <span className="text-xs font-medium text-accent-soft-foreground bg-accent-soft rounded-full px-2 py-1 shrink-0">
            Dia de ouro 🔥
          </span>
        ) : null}
      </header>

      <ul className="grid grid-cols-2 gap-2">
        {items.map(({ key, label, icon: Icon, href }) => {
          const isDone = today[key];

          const content = (
            <>
              <span
                aria-hidden
                className={cn(
                  "size-6 shrink-0 rounded-full flex items-center justify-center",
                  isDone
                    ? "bg-accent text-accent-foreground"
                    : "bg-surface text-muted",
                )}
              >
                {isDone ? (
                  <Check className="size-3.5" />
                ) : (
                  <Icon className="size-3.5" />
                )}
              </span>
              <span className="text-pretty group-hover:underline">
                {label}
                <span className="sr-only">
                  : {isDone ? "concluído" : "pendente"}
                </span>
              </span>
            </>
          );

          const baseClassName = cn(
            "flex min-h-11 items-center gap-2 rounded-xl p-2 text-sm",
            isDone
              ? "bg-accent-soft text-accent-soft-foreground"
              : "bg-default text-muted",
          );

          return (
            <li key={key}>
              {isDone ? (
                <div className={baseClassName}>{content}</div>
              ) : (
                <Link
                  to={href}
                  className={cn(
                    baseClassName,
                    "group outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent",
                  )}
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
