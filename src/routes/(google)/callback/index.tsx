import { Button, Spinner } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { takeGoogleReturnTo } from "@/utils/googleStorage";

const errorMessages: Record<string, string> = {
  access_denied: "Você cancelou a conexão com o Google.",
  invalid_state: "Não foi possível confirmar a conexão com o Google. Tente novamente.",
  no_refresh_token: "O Google não concedeu acesso contínuo. Tente conectar novamente.",
};

export default function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Conexão com o Google concluída.");
  const [error, setError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const returnTo = takeGoogleReturnTo();
    const authError = searchParams.get("error");

    if (authError !== null) {
      setError(errorMessages[authError] ?? "Não foi possível concluir a conexão com o Google.");
      return;
    }

    setMessage("Conexão com o Google concluída. Voltando ao Revi…");
    window.setTimeout(() => void navigate(returnTo, { replace: true }), 700);
  }, [navigate, searchParams]);

  useEffect(() => {
    if (error !== null) headingRef.current?.focus();
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      {error === null ? (
        <section className="flex max-w-sm flex-col items-center gap-3 text-center" aria-busy="true">
          <Spinner size="lg" />
          <h1 ref={headingRef} tabIndex={-1} className="text-xl font-semibold" role="status">
            {message}
          </h1>
        </section>
      ) : (
        <section className="flex max-w-sm flex-col items-center gap-4 rounded-3xl bg-surface p-6 text-center shadow-surface">
          <h1 ref={headingRef} tabIndex={-1} className="text-xl font-semibold">
            Conexão não concluída
          </h1>
          <p className="text-muted text-sm text-pretty" role="alert">{error}</p>
          <Button onPress={() => void navigate("/perfil", { replace: true })}>
            Tentar novamente
          </Button>
        </section>
      )}
    </main>
  );
}
