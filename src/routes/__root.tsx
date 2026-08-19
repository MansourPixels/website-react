import { createRootRoute, Outlet } from "@tanstack/react-router";
import { BottomNavigation } from "../components/BottomNavigation";

const RootLayout = () => (
  <>
    <div className="pb-16 flex flex-col min-h-full relative">
      <Outlet />
    </div>
    <BottomNavigation />
  </>
);

export const Route = createRootRoute({ component: RootLayout });
