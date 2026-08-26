import { Outlet } from "react-router";

import { RequireAuth } from "@/components/RequireAuth";

export default function ProtectedLayout() {
  return (
    <RequireAuth>
      <Outlet />
    </RequireAuth>
  );
}
