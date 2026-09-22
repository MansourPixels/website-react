import { cn } from "@heroui/styles";
import { Coins, Gauge, Inbox, type LucideIcon, Scale, Users } from "lucide-react";
import { NavLink } from "react-router";

interface AdminSection {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const ADMIN_SECTIONS: AdminSection[] = [
  { to: "/admin", label: "Início", icon: Gauge, end: true },
  { to: "/admin/custos", label: "Custos", icon: Coins },
  { to: "/admin/usuarios", label: "Usuários", icon: Users },
  { to: "/admin/filas", label: "Filas e falhas", icon: Inbox },
  { to: "/admin/cotas", label: "Cotas e planos", icon: Scale },
];

/**
 * Menu lateral no desktop e abas roladas no celular: o mesmo `<nav>`, com a
 * direção trocada no breakpoint `md`.
 */
export function AdminNavigation() {
  return (
    <nav
      aria-label="Seções da administração"
      className="flex gap-1 overflow-x-auto px-4 pb-2 md:flex-col md:overflow-visible md:px-0 md:pb-0"
    >
      {ADMIN_SECTIONS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted hover:bg-surface hover:text-foreground",
            )
          }
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
