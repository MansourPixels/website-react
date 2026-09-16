import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { completeOnboarding, getOnboardingState } from "@/api/onboarding";
import { useAuth } from "@/contexts/AuthContext";

export type OnboardingStatus = "loading" | "pending" | "done";

interface OnboardingContextValue {
  status: OnboardingStatus;
  /** Marca como concluído e libera o gate. */
  complete: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

/**
 * Resolve o estado do onboarding uma vez por sessão, aqui em cima, para que o
 * gate de `(private)` não dispare uma leitura por navegação.
 *
 * `status` começa em `"loading"` mesmo com a fachada síncrona de hoje: quando
 * `src/api/onboarding.ts` virar `apiFetch`, este provider não muda de forma — o
 * estado de carregamento já existe e já é tratado por quem consome.
 */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user, status: authStatus } = useAuth();
  const [status, setStatus] = useState<OnboardingStatus>("loading");

  const ownerId = user?.id ?? null;

  useEffect(() => {
    // Sem sessão não há o que resolver, e `RequireAuth` já cuida do redirect.
    // Voltar para "loading" é o que impede o estado do aluno anterior de vazar
    // para o próximo login neste mesmo aparelho.
    if (authStatus !== "authenticated" || ownerId === null) {
      setStatus("loading");

      return;
    }

    let cancelled = false;

    getOnboardingState(ownerId)
      .then(({ completedAt }) => {
        if (!cancelled) setStatus(completedAt === null ? "pending" : "done");
      })
      .catch(() => {
        // Falha de leitura não pode trancar o aluno numa tela de verificação
        // eterna: seguir como "done" deixa o app inteiro acessível, e o custo é
        // só não mostrar o onboarding a quem talvez devesse vê-lo.
        if (!cancelled) setStatus("done");
      });

    return () => {
      cancelled = true;
    };
  }, [authStatus, ownerId]);

  const complete = useCallback(async () => {
    if (ownerId === null) return;

    await completeOnboarding(ownerId);
    setStatus("done");
  }, [ownerId]);

  const value = useMemo(() => ({ status, complete }), [status, complete]);

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);

  if (context === null) {
    throw new Error("useOnboarding precisa estar dentro de OnboardingProvider");
  }

  return context;
}
