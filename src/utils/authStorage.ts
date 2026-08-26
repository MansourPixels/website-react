import type { User } from "@/types/User";

// Autenticação simulada: não há backend no projeto, então contas e sessão
// vivem no localStorage. A senha é guardada em texto puro — isso serve para
// a demonstração e não deve ser tratado como autenticação real.
export interface StoredAccount extends User {
  password: string;
}

const ACCOUNTS_KEY = "revi:contas";
const SESSION_KEY = "revi:sessao";

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);

    if (raw === null) return null;

    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Armazenamento cheio ou bloqueado: a sessão segue apenas em memória.
  }
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function readAccounts(): StoredAccount[] {
  const accounts = readJson<StoredAccount[]>(ACCOUNTS_KEY);

  if (!Array.isArray(accounts)) return [];

  return accounts.filter(
    (account) =>
      typeof account?.id === "string" &&
      typeof account?.name === "string" &&
      typeof account?.email === "string" &&
      typeof account?.password === "string",
  );
}

export function writeAccounts(accounts: StoredAccount[]) {
  writeJson(ACCOUNTS_KEY, accounts);
}

export function readSession(): User | null {
  const session = readJson<User>(SESSION_KEY);

  if (
    session === null ||
    typeof session.id !== "string" ||
    typeof session.name !== "string" ||
    typeof session.email !== "string"
  ) {
    return null;
  }

  return { id: session.id, name: session.name, email: session.email };
}

export function writeSession(user: User) {
  writeJson(SESSION_KEY, user);
}

export function clearSession() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // Sem acesso ao armazenamento: nada a limpar.
  }
}
