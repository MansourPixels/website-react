import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { User } from "@/types/User";
import {
  clearSession,
  normalizeEmail,
  readAccounts,
  readSession,
  writeAccounts,
  writeSession,
  type StoredAccount,
} from "@/utils/authStorage";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type AuthResult = { ok: true } | { ok: false; error: string };

const errorMessages = {
  emailTaken: "Este e-mail já está cadastrado.",
  invalidCredentials: "E-mail ou senha incorretos.",
  incompleteForm: "Preencha todos os campos para continuar.",
};

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  signIn: (email: string, password: string) => AuthResult;
  signUp: (name: string, email: string, password: string) => AuthResult;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    const session = readSession();

    setUser(session);
    setStatus(session === null ? "unauthenticated" : "authenticated");
  }, []);

  const signUp = useCallback(
    (name: string, email: string, password: string): AuthResult => {
      const trimmedName = name.trim();
      const normalizedEmail = normalizeEmail(email);

      if (trimmedName.length === 0 || normalizedEmail.length === 0 || password.length === 0) {
        return { ok: false, error: errorMessages.incompleteForm };
      }

      const accounts = readAccounts();

      if (accounts.some((account) => account.email === normalizedEmail)) {
        return { ok: false, error: errorMessages.emailTaken };
      }

      const account: StoredAccount = {
        id: crypto.randomUUID(),
        name: trimmedName,
        email: normalizedEmail,
        password,
      };

      writeAccounts([...accounts, account]);

      const session: User = {
        id: account.id,
        name: account.name,
        email: account.email,
      };

      writeSession(session);
      setUser(session);
      setStatus("authenticated");

      return { ok: true };
    },
    [],
  );

  const signIn = useCallback((email: string, password: string): AuthResult => {
    const normalizedEmail = normalizeEmail(email);
    const account = readAccounts().find(
      (candidate) =>
        candidate.email === normalizedEmail && candidate.password === password,
    );

    if (account === undefined) {
      return { ok: false, error: errorMessages.invalidCredentials };
    }

    const session: User = {
      id: account.id,
      name: account.name,
      email: account.email,
    };

    writeSession(session);
    setUser(session);
    setStatus("authenticated");

    return { ok: true };
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setUser(null);
    setStatus("unauthenticated");
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
