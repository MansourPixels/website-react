import { Spinner } from "@heroui/react";
import { useEffect, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";

import { useOnboarding } from "@/contexts/OnboardingContext";
import { NEXT_ROUTE_PARAM } from "@/utils/authRedirect";

/**
 * Irmão do `RequireAuth`, e composto dentro dele no layout de `(private)`.
 *
 * Fica aqui, e não em `resolveNextRoute`, porque `resolveNextRoute` cobriria só
 * o caminho logo após o cadastro. No layout ele também pega o reload no meio do
 * fluxo, a URL digitada à mão e a volta do redirect do Spotify — toda rota
 * privada passa por aqui. Os três redirects pós-login continuam apontando para
 * `/capturar` sem alteração: o gate os intercepta na chegada.
 *
 * `/onboarding` mora fora do layout de `(private)` justamente para não passar
 * por este componente, o que fecharia um laço infinito. É a mesma razão pela
 * qual os callbacks do Spotify e do Google já moram fora dali — e é o que
 * impede o gate de sequestrá-los no meio do handshake de OAuth.
 */
export function RequireOnboarding({ children }: { children: ReactNode }) {
  const { status } = useOnboarding();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Só navega com estado conhecido: redirecionar durante o "loading" e
    // descobrir depois que estava concluído faria o par gate/tela alternar.
    if (status !== "pending") return;

    // O destino pretendido vai junto, no mesmo parâmetro que o login já usa.
    // Sem isso, quem abre um convite de turma sem conta perde o convite: o
    // cadastro leva ao onboarding e o onboarding terminaria em `/capturar`.
    const target = `${pathname}${search}`;

    navigate(`/onboarding?${NEXT_ROUTE_PARAM}=${encodeURIComponent(target)}`, {
      replace: true,
    });
  }, [status, pathname, search, navigate]);

  if (status !== "done") {
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
