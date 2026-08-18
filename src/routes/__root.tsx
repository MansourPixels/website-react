import { createRootRoute, Outlet } from "@tanstack/react-router";
import { BottomNavigation } from "../components/BottomNavigation";

const RootLayout = () => (
  <>
    <div className="pb-16">
      <Outlet />
    </div>
    <BottomNavigation />
  </>
);

export const Route = createRootRoute({ component: RootLayout });
