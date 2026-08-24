import { buttonVariants } from "@heroui/styles";
import { Link } from "@tanstack/react-router";
import { type LucideIcon } from "lucide-react";

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
    <nav className="grid w-full grid-cols-4 border-t fixed bottom-0 inset-x-0 bg-white pb-[env(safe-area-inset-bottom,0px)] md:pb-0 md:max-w-md md:mx-auto md:rounded-full md:overflow-hidden md:border md:mb-[max(1rem,env(safe-area-inset-bottom))] z-40">
      {links.map(({ to, label, icon: Icon, exact }) => (
        <Link
          key={to}
          to={to}
          className={buttonVariants({
            className:
              "h-16 w-full p-2 flex flex-col items-center justify-center rounded-none gap-0 font-medium text-muted [&.active]:text-accent group",
            variant: "ghost",
          })}
          activeOptions={{ exact }}
        >
          <Icon />
          {label}
        </Link>
      ))}
    </nav>
  );
}
