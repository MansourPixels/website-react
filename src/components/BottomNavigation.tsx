import { Link } from "@tanstack/react-router";
import {
  CalendarCheck,
  Folders,
  Home,
  Route,
  type LucideIcon,
} from "lucide-react";


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
    <nav className="grid w-full grid-cols-4 border-t fixed bottom-0 inset-x-0 bg-white md:max-w-md md:mx-auto md:rounded-full md:overflow-hidden md:border md:mb-4">
      {links.map(({ to, label, icon: Icon, exact }) => (
        <Link
          to={to}
          className="button button--md button--ghost h-16 w-full p-2 flex flex-col items-center justify-center rounded-none gap-0 font-medium text-muted [&.active]:text-accent group"
          activeOptions={{ exact }}
        >
          <Icon />
          {label}
        </Link>
      ))}
    </nav>
  );
}
