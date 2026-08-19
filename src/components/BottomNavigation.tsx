import { Link } from "@tanstack/react-router";
import { CalendarCheck, Folders, Home, Route } from "lucide-react";

const links = [
  {
    to: "/",
    exact: true,
    label: "Início",
    icon: Home,
  },
  {
    to: "/pastas",
    label: "Pastas",
    icon: Folders,
  },
  {
    to: "/ascensao",
    label: "Ascensão",
    icon: CalendarCheck,
  },
  {
    to: "/trilha",
    label: "Trilha",
    icon: Route,
  },
];

export function BottomNavigation() {
  return (
    <nav className="grid w-full grid-cols-4 border-t fixed bottom-0 inset-x-0 bg-white">
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
