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
    <nav className="grid w-full grid-cols-5 border-t fixed bottom-0 inset-x-0 bg-white pb-[env(safe-area-inset-bottom,0px)] md:pb-0 md:max-w-md md:mx-auto md:rounded-full md:overflow-hidden md:border md:mb-[max(1rem,env(safe-area-inset-bottom))] z-40">
      {links.map(({ to, label, icon: Icon, exact }) => (
        <NavLink
          key={to}
          to={to}
          end={exact}
          className={({ isActive }) =>
            cn(
              buttonVariants({
                className:
                  "h-16 w-full p-1 flex flex-col items-center justify-center rounded-none gap-0.5 font-medium text-xs sm:text-sm leading-tight text-center text-muted [&.active]:text-accent group",
                variant: "ghost",
              }),
              isActive && "active",
            )
          }
        >
          <Icon />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
