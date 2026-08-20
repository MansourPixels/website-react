import {
  createRootRoute,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { CalendarCheck, Folders, Home, Route as Path } from "lucide-react";

import { cn } from "@heroui/styles";
import { BottomNavigation } from "../components/BottomNavigation";

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
    icon: Path,
  },
];

const RootLayout = () => {
  const routerState = useRouterState();
  const showBottomNavigation = links.some(
    ({ to }) => routerState.location.pathname === to,
  );

  return (
    <>
      <div
        className={cn(
          "flex flex-col min-h-full relative",
          showBottomNavigation && "pb-16",
        )}
      >
        <Outlet />
      </div>
      {showBottomNavigation ? <BottomNavigation links={links} /> : null}
    </>
  );
};

export const Route = createRootRoute({ component: RootLayout });
