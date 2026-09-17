import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { GoogleIssue, GoogleStatus, GoogleToken } from "@/types/Google";
import {
  CALENDAR_SCOPE,
  DRIVE_SCOPE,
  EMAIL_SCOPE,
  GoogleError,
  type GoogleAuthMode,
  ensureAccessToken,
  getAuthMode,
  hasScope,
  isConfigured as readIsConfigured,
  isDriveConfigured as readIsDriveConfigured,
  requestConsent,
  restoreToken,
  revokeAccess,
  setGoogleAuthDriver,
} from "@/utils/googleAuth";
import { backendProxyDriver } from "@/utils/googleAuthDrivers/backendProxy";
import { browserGisDriver } from "@/utils/googleAuthDrivers/browserGis";
import { GOOGLE_CLEARED_EVENT, readGoogleToken } from "@/utils/googleStorage";

const USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

interface GoogleContextValue {
  status: GoogleStatus;
  issue: GoogleIssue;
  isConfigured: boolean;
  /** O Picker precisa de chave de API própria, que a Agenda não exige. */
  isDriveConfigured: boolean;
  mode: GoogleAuthMode;
  email: string | null;
  hasDrive: boolean;
  hasCalendar: boolean;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  /** Token válido sem interação, ou null quando a conexão expirou. */
  ensureToken: () => Promise<string | null>;
  /** Usado pelo retorno do modo backend. */
  completeConnection: () => Promise<boolean>;
  clearIssue: () => void;
}

const GoogleContext = createContext<GoogleContextValue | null>(null);

async function fetchEmail(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { email?: string };

    return data.email ?? null;
  } catch {
    return null;
  }
}

export function GoogleProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<GoogleStatus>("loading");
  const [issue, setIssue] = useState<GoogleIssue>(null);
  const [email, setEmail] = useState<string | null>(null);
  // Escopos concedidos, não os pedidos: a tela de consentimento do Google
  // deixa o aluno desmarcar um a um.
  const [grantedScope, setGrantedScope] = useState("");

  const mode = getAuthMode();
  const isConfigured = readIsConfigured();
  const isDriveConfigured = readIsDriveConfigured();

  // Registra o driver uma única vez, antes de qualquer pedido de token —
  // exatamente como o `PreferencesContext` registra o `SpeechDriver`.
  useEffect(() => {
    setGoogleAuthDriver(
      mode === "backend" ? backendProxyDriver : browserGisDriver,
    );
  }, [mode]);

  const applyToken = useCallback((token: GoogleToken) => {
    setGrantedScope(token.scope);
    setStatus("connected");
    setIssue(null);
  }, []);

  useEffect(() => {
    if (!isConfigured) {
      setStatus("disconnected");

      return;
    }

    // Sem token guardado não há conexão anterior para restaurar, e carregar o
    // SDK do Google aqui cobraria o custo de quem nunca usou a integração. No
    // modo backend a verdade mora no servidor, então a consulta vale sempre.
    if (mode === "browser" && readGoogleToken() === null) {
      setStatus("disconnected");

      return;
    }

    let cancelled = false;

    restoreToken()
      .then(async (token) => {
        if (cancelled) return;

        if (token === null) {
          setStatus("disconnected");

          return;
        }

        applyToken(token);

        if (!hasScope(token.scope, EMAIL_SCOPE)) return;

        const restoredEmail = await fetchEmail(token.accessToken);

        if (!cancelled) setEmail(restoredEmail);
      })
      .catch(() => {
        if (!cancelled) setStatus("disconnected");
      });

    return () => {
      cancelled = true;
    };
  }, [isConfigured, mode, applyToken]);

  // `signOut` limpa os tokens do Google direto no armazenamento; o evento é o
  // que mantém esta máquina de estados honesta sem criar dependência circular.
  useEffect(() => {
    function handleCleared() {
      setStatus("disconnected");
      setEmail(null);
      setGrantedScope("");
      setIssue(null);
    }

    window.addEventListener(GOOGLE_CLEARED_EVENT, handleCleared);

    return () => window.removeEventListener(GOOGLE_CLEARED_EVENT, handleCleared);
  }, []);

  const finishWithToken = useCallback(
    async (token: GoogleToken) => {
      applyToken(token);

      if (hasScope(token.scope, EMAIL_SCOPE)) {
        setEmail(await fetchEmail(token.accessToken));
      }

      return true;
    },
    [applyToken],
  );

  const connect = useCallback(async () => {
    if (!readIsConfigured()) return false;

    setStatus("connecting");
    setIssue(null);

    try {
      const token = await requestConsent();

      if (token === null) {
        setStatus("disconnected");

        return false;
      }

      return await finishWithToken(token);
    } catch (error) {
      setStatus("disconnected");
      setIssue(error instanceof GoogleError ? error.issue : "requestFailed");

      return false;
    }
  }, [finishWithToken]);

  const completeConnection = useCallback(async () => {
    const token = await restoreToken();

    if (token === null) {
      setStatus("disconnected");

      return false;
    }

    return finishWithToken(token);
  }, [finishWithToken]);

  const disconnect = useCallback(async () => {
    // `revokeAccess` limpa o armazenamento no `finally` e o evento acima
    // devolve a máquina para "disconnected".
    await revokeAccess();
  }, []);

  const ensureToken = useCallback(async () => {
    const token = await ensureAccessToken();

    if (token === null) {
      setStatus("disconnected");
      setEmail(null);
      setGrantedScope("");
    }

    return token;
  }, []);

  const clearIssue = useCallback(() => setIssue(null), []);

  const value = useMemo(
    () => ({
      status,
      issue,
      isConfigured,
      isDriveConfigured,
      mode,
      email,
      hasDrive: hasScope(grantedScope, DRIVE_SCOPE),
      hasCalendar: hasScope(grantedScope, CALENDAR_SCOPE),
      connect,
      disconnect,
      ensureToken,
      completeConnection,
      clearIssue,
    }),
    [
      status,
      issue,
      isConfigured,
      isDriveConfigured,
      mode,
      email,
      grantedScope,
      connect,
      disconnect,
      ensureToken,
      completeConnection,
      clearIssue,
    ],
  );

  return (
    <GoogleContext.Provider value={value}>{children}</GoogleContext.Provider>
  );
}

export function useGoogle() {
  const context = useContext(GoogleContext);

  if (context === null) {
    throw new Error("useGoogle precisa estar dentro de GoogleProvider");
  }

  return context;
}
