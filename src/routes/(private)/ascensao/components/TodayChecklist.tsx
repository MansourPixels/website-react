import type { StreakTodayChecklist } from "@/types/api/streak";
import { cn } from "@heroui/react";
import { Camera, Check, FileText, ListCheck, Zap, type LucideIcon } from "lucide-react";

interface ChecklistItem {
  key: keyof StreakTodayChecklist;
  label: string;
  icon: LucideIcon;
}

const items: ChecklistItem[] = [
  { key: "upload", label: "Enviar material", icon: Camera },
  { key: "summary", label: "Ler um resumo", icon: FileText },
  { key: "flashcards", label: "Revisar flash cards", icon: Zap },
  { key: "quiz", label: "Fazer um simulado", icon: ListCheck },
];

interface TodayChecklistProps {
  today: StreakTodayChecklist;
  isGold: boolean;
}

export function TodayChecklist({ today, isGold }: TodayChecklistProps) {
  return (
    <section className="bg-white rounded-3xl shadow-surface p-4 flex flex-col gap-3">
      <header className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">Checklist de hoje</h2>
        {isGold ? (
          <span className="text-xs font-medium text-accent bg-accent-soft rounded-full px-2 py-1 shrink-0">
            Dia de ouro 🔥
          </span>
        ) : null}
      </header>

      <ul className="grid grid-cols-2 gap-2">
        {items.map(({ key, label, icon: Icon }) => {
          const isDone = today[key];

          return (
            <li
              key={key}
              className={cn(
                "flex items-center gap-2 rounded-xl p-2 text-sm",
                isDone
                  ? "bg-accent-soft text-accent"
                  : "bg-zinc-100 text-zinc-400",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "size-6 shrink-0 rounded-full flex items-center justify-center",
                  isDone ? "bg-accent text-accent-foreground" : "bg-zinc-200",
                )}
              >
                {isDone ? (
                  <Check className="size-3.5" />
                ) : (
                  <Icon className="size-3.5" />
                )}
              </span>
              <span className="text-pretty">
                {label}
                <span className="sr-only">
                  : {isDone ? "concluído" : "pendente"}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
