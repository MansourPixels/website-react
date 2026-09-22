import { useEffect, useState } from "react";

import { ADMIN_FORBIDDEN_EVENT } from "@/api/admin";
import { getWhoami, isAdmin } from "@/api/user";
import type { AdminAccessStatus } from "@/utils/adminGate";

export interface AdminAccess {
  status: AdminAccessStatus;
  isAdmin: boolean;
}

/**
 * Descobre, pelo `GET /api/whoami`, se a pessoa tem o papel `admin`. Um `403`
 * de qualquer rota de admin durante o uso (o papel foi tirado) derruba o acesso
 * na hora, sem esperar outra leitura.
 */
export function useAdminAccess(): AdminAccess {
  const [access, setAccess] = useState<AdminAccess>({
    status: "loading",
    isAdmin: false,
  });

  useEffect(() => {
    let cancelled = false;

    getWhoami()
      .then((whoami) => {
        if (!cancelled) setAccess({ status: "ready", isAdmin: isAdmin(whoami) });
      })
      .catch(() => {
        if (!cancelled) setAccess({ status: "error", isAdmin: false });
      });

    const revoke = () => setAccess({ status: "ready", isAdmin: false });
    window.addEventListener(ADMIN_FORBIDDEN_EVENT, revoke);

    return () => {
      cancelled = true;
      window.removeEventListener(ADMIN_FORBIDDEN_EVENT, revoke);
    };
  }, []);

  return access;
}
