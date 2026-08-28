import { useEffect } from "react";
import { Link, Outlet, useNavigate, useSearchParams } from "react-router";

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
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <Link
        to="/"
        className="flex items-center gap-2 rounded-full outline-accent outline-offset-4 focus-visible:outline-2"
      >
        <img src="/logo.svg" alt="" className="size-8" />
        <span className="text-lg font-semibold">Revi</span>
        <span className="sr-only">Voltar para a página inicial</span>
      </Link>

      <div className="flex w-full max-w-sm flex-col gap-6 rounded-3xl bg-white p-6 shadow-surface">
        <Outlet />
      </div>
    </main>
  );
}
