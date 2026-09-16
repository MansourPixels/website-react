import { buttonVariants, cn } from "@heroui/styles";
import { type LucideIcon } from "lucide-react";
import { NavLink } from "react-router";

interface BottomNavigationProps {
  links: {
    to: string;
    exact?: boolean;
    label: string;
    icon: LucideIcon;
  }[];
}

export function BottomNavigation({ links }: BottomNavigationProps) {
  return (
    <nav
      style={{
        gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))`,
      }}
      className="grid w-full border-t bg-surface pb-[env(safe-area-inset-bottom,0px)] pointer-events-auto md:w-[28rem] md:max-w-full md:pb-0 md:rounded-full md:overflow-hidden md:border"
    >
      {links.map(({ to, label, icon: Icon, exact }) => (
        <NavLink
          key={to}
          to={to}
          end={exact}
          className={({ isActive }) =>
            cn(
              buttonVariants({
                className:
                  // Seis abas em 320px não cabem em 12px: "Capturar" trunca.
                  // O degrau de 11px só existe abaixo de 360px, para não
                  // encolher o rótulo nos aparelhos em que ele já cabia.
                  "h-16 w-full px-0 min-[360px]:px-0.5 py-1 flex flex-col items-center justify-center rounded-none gap-0.5 font-medium text-[0.6875rem] min-[360px]:text-xs sm:text-sm leading-tight text-center text-muted [&.active]:text-accent group",
                variant: "ghost",
              }),
              isActive && "active",
            )
          }
        >
          <Icon className="size-5" />
          <span className="w-full truncate">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
