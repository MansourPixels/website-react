import { useEffect } from "react";
import { Outlet, useNavigate, useSearchParams } from "react-router";

import { AuthCard } from "@/components/AuthCard";
import { useAuth } from "@/contexts/AuthContext";
import { NEXT_ROUTE_PARAM, resolveNextRoute } from "@/utils/authRedirect";

export default function AuthLayout() {
  const { status } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const nextRoute = resolveNextRoute(searchParams.get(NEXT_ROUTE_PARAM));

  useEffect(() => {
    if (status !== "authenticated") return;

    navigate(nextRoute, { replace: true });
  }, [status, nextRoute, navigate]);

  return (
    <AuthCard>
      <Outlet />
    </AuthCard>
  );
}
