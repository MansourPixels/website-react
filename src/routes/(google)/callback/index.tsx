import { Spinner } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

import { useGoogle } from "@/contexts/GoogleContext";
import {
  clearGoogleHandshake,
  readGoogleHandshake,
} from "@/utils/googleStorage";
import { pageMeta } from "@/utils/pageMeta";

export function meta() {
  return pageMeta({
    title: "Conectando o Google",
    description:
      "Concluindo a conexão com a sua conta Google para usar a agenda e o Drive junto do Revi.",
  });
}

const errorMessages = {
  denied: "Você cancelou a conexão com o Google.",
  invalidState:
    "Não foi possível confirmar a origem do pedido. Tente conectar de novo.",
  noRefreshToken:
    "O Google não devolveu a autorização de longo prazo. Remova o Revi em myaccount.google.com/permissions e conecte de novo.",
  exchangeFailed:
    "Não foi possível concluir a conexão com o Google. Tente de novo.",
};

/**
 * Os três motivos que o `revi-back` devolve no redirect. Cada um tem uma saída
 * diferente, então mapear todos para "você cancelou" mandaria o aluno tentar de
 * novo exatamente o que acabou de falhar.
 */
function messageForError(error: string): string {
  if (error === "access_denied") return errorMessages.denied;
  if (error === "invalid_state") return errorMessages.invalidState;
  if (error === "no_refresh_token") return errorMessages.noRefreshToken;

  return errorMessages.exchangeFailed;
}

/**
 * Retorno do modo backend (`VITE_GOOGLE_BACKEND=true`). O `revi-back` já trocou
 * o código pelo refresh token antes de redirecionar para cá; aqui só
 * confirmamos que a conexão existe e devolvemos o aluno de onde ele saiu.
 *
 * No modo navegador esta rota nunca é alcançada: o consentimento acontece num
 * pop-up e a página nunca sai do lugar.
 */
export default function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeConnection } = useGoogle();

  const [error, setError] = useState<string | null>(null);

  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;

    hasRun.current = true;

    const authError = searchParams.get("error");
    const state = searchParams.get("state");
    const handshake = readGoogleHandshake();
    const returnTo = handshake.returnTo ?? "/perfil";

    async function finish() {
      try {
        if (authError !== null) {
          setError(messageForError(authError));

          return;
        }

        // O `state` é opcional aqui — o redirect de sucesso do `revi-back` nem
        // o carrega — porque quem o valida de verdade é o backend, antes da
        // troca; esta conferência só pega uma volta que chegou noutra aba.
        if (state !== null && handshake.state !== null && state !== handshake.state) {
          setError(errorMessages.invalidState);

          return;
        }

        if (!(await completeConnection())) {
          setError(errorMessages.exchangeFailed);

          return;
        }

        void navigate(returnTo, { replace: true });
      } finally {
        clearGoogleHandshake();
      }
    }

    void finish();
  }, [searchParams, navigate, completeConnection]);

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      {error === null ? (
        <div className="flex flex-col items-center gap-3" aria-busy="true">
          <Spinner size="lg" />
          <p className="text-muted text-sm">Conectando ao Google…</p>
        </div>
      ) : (
        <section className="flex max-w-sm flex-col items-center gap-4 rounded-3xl bg-surface p-6 text-center shadow-surface">
          <h1 className="text-xl font-semibold">Conexão não concluída</h1>
          <p className="text-muted text-sm text-pretty" role="alert">
            {error}
          </p>
          <Link
            to="/perfil"
            className={buttonVariants({ variant: "secondary" })}
          >
            Voltar para o perfil
          </Link>
        </section>
      )}
    </main>
  );
}
