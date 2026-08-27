import { Spinner } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

import { useSpotify } from "@/contexts/SpotifyContext";
import { exchangeCodeForTokens } from "@/utils/spotifyAuth";
import { clearHandshake, readHandshake } from "@/utils/spotifyStorage";

const errorMessages = {
  denied: "Você cancelou a conexão com o Spotify.",
  invalidState:
    "Não foi possível confirmar a origem do pedido. Tente conectar de novo.",
  exchangeFailed:
    "Não foi possível concluir a conexão com o Spotify. Tente de novo.",
};

export default function SpotifyCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeConnection } = useSpotify();

  const [error, setError] = useState<string | null>(null);

  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;

    hasRun.current = true;

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const authError = searchParams.get("error");
    const handshake = readHandshake();
    const returnTo = handshake.returnTo ?? "/sessao";

    async function finish() {
      try {
        if (authError !== null) {
          setError(errorMessages.denied);

          return;
        }

        if (
          code === null ||
          state === null ||
          handshake.state === null ||
          handshake.verifier === null ||
          state !== handshake.state
        ) {
          setError(errorMessages.invalidState);

          return;
        }

        const tokens = await exchangeCodeForTokens(code, handshake.verifier);

        if (tokens === null || !(await completeConnection())) {
          setError(errorMessages.exchangeFailed);

          return;
        }

        void navigate(returnTo, { replace: true });
      } finally {
        clearHandshake();
      }
    }

    void finish();
  }, [searchParams, navigate, completeConnection]);

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      {error === null ? (
        <div className="flex flex-col items-center gap-3" aria-busy="true">
          <Spinner size="lg" />
          <p className="text-muted text-sm">Conectando ao Spotify…</p>
        </div>
      ) : (
        <section className="flex max-w-sm flex-col items-center gap-4 rounded-3xl bg-white p-6 text-center shadow-surface">
          <h1 className="text-xl font-semibold">Conexão não concluída</h1>
          <p className="text-muted text-sm text-pretty" role="alert">
            {error}
          </p>
          <Link
            to="/sessao"
            className={buttonVariants({ variant: "secondary" })}
          >
            Voltar para a sessão
          </Link>
        </section>
      )}
    </main>
  );
}
