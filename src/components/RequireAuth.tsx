import { Spinner } from "@heroui/react";
import { useEffect, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";

import { useAuth } from "@/contexts/AuthContext";
import { buildSignInPath } from "@/utils/authRedirect";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (status !== "unauthenticated") return;

    navigate(buildSignInPath(pathname, search), { replace: true });
  }, [status, pathname, search, navigate]);

  if (status !== "authenticated") {
    return (
      <div
        className="flex flex-1 items-center justify-center p-6"
        aria-busy="true"
      >
        <Spinner size="lg" />
        <span className="sr-only">Verificando sua sessão</span>
      </div>
    );
  }

  return children;
}
