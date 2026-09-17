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
  login as apiLogin,
  logout as apiLogout,
  refresh as apiRefresh,
  register as apiRegister,
} from "@/api/auth";
import { AUTH_EXPIRED_EVENT, ApiError } from "@/api/client";
import {
  clearTokens,
  isAccessTokenExpiring,
  readTokens,
  writeTokens,
} from "@/api/tokenStorage";
import type { User } from "@/types/User";
import { clearGoogleTokens } from "@/utils/googleStorage";
import { decodeAccessTokenClaims } from "@/utils/jwt";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type AuthResult = { ok: true } | { ok: false; error: string };

const GENERIC_NETWORK_ERROR = "Não foi possível conectar. Tente novamente.";

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (
    username: string,
    email: string,
    password: string,
  ) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// A API não expõe um "meu perfil": login só devolve tokens. O access token é
// um JWT real do Keycloak, então extraímos id/e-mail/username das claims em
// vez de guardar esses dados separadamente.
function userFromAccessToken(
  accessToken: string,
  fallbackEmail: string,
): User | null {
  const claims = decodeAccessTokenClaims(accessToken);

  if (claims === null) return null;

  const email = claims.email ?? fallbackEmail;
  const username =
    claims.preferred_username ??
    (email.length > 0 ? email.split("@")[0] : claims.sub.slice(0, 8));

  return {
    id: claims.sub,
    email,
    username,
    emailVerified: claims.email_verified ?? false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const tokens = readTokens();

      if (tokens === null) {
        if (!cancelled) setStatus("unauthenticated");
        return;
      }

      if (!isAccessTokenExpiring(tokens)) {
        const localUser = userFromAccessToken(tokens.accessToken, "");

        if (!cancelled) {
          setUser(localUser);
          setStatus(localUser === null ? "unauthenticated" : "authenticated");
        }
        return;
      }

      try {
        const refreshed = await apiRefresh(tokens.refreshToken);

        writeTokens(refreshed);

        const localUser = userFromAccessToken(refreshed.accessToken, "");

        if (!cancelled) {
          setUser(localUser);
          setStatus(localUser === null ? "unauthenticated" : "authenticated");
        }
      } catch {
        clearTokens();
        if (!cancelled) setStatus("unauthenticated");
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  // Renovação automática (client.ts) falhou de vez: encerra a sessão local.
  useEffect(() => {
    function handleAuthExpired() {
      setUser(null);
      setStatus("unauthenticated");
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);

    return () =>
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, []);

  const signUp = useCallback(
    async (
      username: string,
      email: string,
      password: string,
    ): Promise<AuthResult> => {
      try {
        const response = await apiRegister({ username, email, password });

        writeTokens(response);
        setUser({
          id: response.id,
          email: response.email,
          username: response.username,
          emailVerified: false,
        });
        setStatus("authenticated");

        return { ok: true };
      } catch (error) {
        if (error instanceof ApiError) return { ok: false, error: error.detail };

        return { ok: false, error: GENERIC_NETWORK_ERROR };
      }
    },
    [],
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        const tokens = await apiLogin({ email, password });

        writeTokens(tokens);
        setUser(userFromAccessToken(tokens.accessToken, email));
        setStatus("authenticated");

        return { ok: true };
      } catch (error) {
        if (error instanceof ApiError) return { ok: false, error: error.detail };

        return { ok: false, error: GENERIC_NETWORK_ERROR };
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    const tokens = readTokens();

    // O token do Google dá acesso de *escrita* à agenda pessoal do aluno:
    // deixá-lo neste aparelho depois que ele saiu da conta não é aceitável. A
    // conexão com o Spotify é só leitura e reprodução, e continua onde está.
    clearGoogleTokens();
    clearTokens();
    setUser(null);
    setStatus("unauthenticated");

    if (tokens !== null) {
      try {
        await apiLogout(tokens.refreshToken);
      } catch {
        // Sessão local já foi limpa; falha ao revogar no back não bloqueia o usuário.
      }
    }
  }, []);

  const value = useMemo(
    () => ({ user, status, signIn, signUp, signOut }),
    [user, status, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error("useAuth precisa estar dentro de AuthProvider");
  }

  return context;
}
