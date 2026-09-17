import { Button, Spinner } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { takeGoogleReturnTo } from "@/utils/googleStorage";
import { googleCallbackErrorMessage } from "@/utils/googleCallback";

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

    const errorMessage = googleCallbackErrorMessage(authError);

    if (errorMessage !== null) {
      setError(errorMessage);
      return;
    }

    setMessage("Conexão com o Google concluída. Voltando ao Revi…");
    window.setTimeout(() => void navigate(returnTo, { replace: true }), 700);
  }, [navigate, searchParams]);

  useEffect(() => headingRef.current?.focus(), [error, message]);

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
