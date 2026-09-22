import { type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

interface AdminShortcutCardProps {
  to: string;
  title: string;
  description: string;
  icon: LucideIcon;
  children?: ReactNode;
}

/** Um atalho da página inicial da administração, com números opcionais embaixo. */
export function AdminShortcutCard({ to, title, description, icon: Icon, children }: AdminShortcutCardProps) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl bg-surface p-4 shadow-surface">
      <Link to={to} className="group flex items-center gap-3">
        <div className="size-9 shrink-0 rounded-lg flex items-center justify-center bg-accent text-accent-foreground">
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="flex min-w-0 flex-col">
          <h2 className="font-semibold group-hover:underline">{title}</h2>
          <p className="text-xs text-muted text-pretty">{description}</p>
        </div>
      </Link>
      {children}
    </article>
  );
}
