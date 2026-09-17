import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  disconnectGoogle,
  getGoogleAuthorizeUrl,
  getGoogleConnectionStatus,
  getGoogleToken,
} from "@/api/google";
import { ApiError } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import type { GoogleConnectionStatus, GoogleToken } from "@/types/api/google";
import { saveGoogleReturnTo, validGoogleReturnTo } from "@/utils/googleStorage";

type GoogleStatus = "loading" | "connected" | "disconnected";

interface GoogleContextValue {
  status: GoogleStatus;
  connection: GoogleConnectionStatus | null;
  connect: (returnTo: string) => Promise<void>;
  disconnect: () => Promise<void>;
  getToken: () => Promise<GoogleToken | null>;
}

const GoogleContext = createContext<GoogleContextValue | null>(null);

export function GoogleProvider({ children }: { children: ReactNode }) {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<GoogleStatus>("loading");
  const [connection, setConnection] = useState<GoogleConnectionStatus | null>(null);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      setConnection(null);
      setStatus(authStatus === "loading" ? "loading" : "disconnected");
      return;
    }

    let cancelled = false;
    setStatus("loading");

    getGoogleConnectionStatus()
      .then((next) => {
        if (cancelled) return;
        setConnection(next);
        setStatus(next.connected ? "connected" : "disconnected");
      })
      .catch(() => {
        if (!cancelled) setStatus("disconnected");
      });

    return () => {
      cancelled = true;
    };
  }, [authStatus]);

  const connect = useCallback(async (returnTo: string) => {
    const safeReturnTo = validGoogleReturnTo(returnTo);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const { url } = await getGoogleAuthorizeUrl(safeReturnTo, timeZone);

    saveGoogleReturnTo(safeReturnTo);
    window.location.assign(url);
  }, []);

  const disconnect = useCallback(async () => {
    await disconnectGoogle();
    setConnection({ connected: false, email: null, scopes: [] });
    setStatus("disconnected");
  }, []);

  const getToken = useCallback(async () => {
    try {
      return await getGoogleToken();
    } catch (error) {
      // Sem token utilizável a integração acabou, mas a sessão Revi permanece válida.
      if (error instanceof ApiError && error.status === 404) {
        setConnection({ connected: false, email: null, scopes: [] });
        setStatus("disconnected");
        return null;
      }

      throw error;
    }
  }, []);

  const value = useMemo(
    () => ({ status, connection, connect, disconnect, getToken }),
    [status, connection, connect, disconnect, getToken],
  );

  return <GoogleContext.Provider value={value}>{children}</GoogleContext.Provider>;
}

export function useGoogle() {
  const context = useContext(GoogleContext);

  if (context === null) {
    throw new Error("useGoogle precisa estar dentro de GoogleProvider");
  }

  return context;
}
