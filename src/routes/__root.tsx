import {
  createRootRoute,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { CalendarCheck, Camera, Folders, Route as Path } from "lucide-react";

import { cn } from "@heroui/styles";
import { BottomNavigation } from "../components/BottomNavigation";
import { StudyPlanProvider } from "../contexts/StudyPlanContext";

const links = [
  {
    to: "/capturar",
    label: "Capturar",
    icon: Camera,
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
    <StudyPlanProvider>
      <div
        className={cn(
          "flex flex-col min-h-full relative",
          showBottomNavigation && "pb-[var(--nav-inset)]",
        )}
      >
        <Outlet />
      </div>
      {showBottomNavigation ? <BottomNavigation links={links} /> : null}
    </StudyPlanProvider>
  );
};

export const Route = createRootRoute({ component: RootLayout });
