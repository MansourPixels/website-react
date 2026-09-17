import { Outlet } from "react-router";

import { RequireAuth } from "@/components/RequireAuth";
import { RequireOnboarding } from "@/components/RequireOnboarding";

export default function ProtectedLayout() {
  return (
    <RequireAuth>
      <RequireOnboarding>
        <Outlet />
      </RequireOnboarding>
    </RequireAuth>
  );
}
