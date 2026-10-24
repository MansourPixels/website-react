import { Button, Checkbox, Skeleton } from "@heroui/react";
import { PartyPopper } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { getRaffleStatus, registerForRaffle } from "@/api/raffle";
import { Confetti } from "@/components/Confetti";
import { ErrorState } from "@/components/ErrorState";
import type { RaffleStatus } from "@/types/api/raffle";
import { pageMeta } from "@/utils/pageMeta";

export function meta() {
  return pageMeta({
    title: "Sorteio",
    description: "Participe do sorteio do evento com a sua conta do Revi.",
  });
}

export default function SorteioPage() {
  const [status, setStatus] = useState<RaffleStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [consent, setConsent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  // Enquanto for 0, nenhum confete apareceu ainda; cada inscrição bem-sucedida
  // incrementa o valor para disparar uma nova explosão.
  const [celebrateKey, setCelebrateKey] = useState(0);
  // O botão já fica desabilitado enquanto envia, mas um segundo toque pode
  // chegar antes da renderização que o desabilita; a ref fecha essa janela.
  const isSubmitting = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    getRaffleStatus(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setStatus(result);
      })
      .catch(() => {
        // Ao desmontar, o próprio cancelamento rejeita a promise: não é falha.
        if (controller.signal.aborted) return;

        setLoadError("Não foi possível carregar o sorteio.");
      });

    return () => controller.abort();
  }, [reloadKey]);

  function handleRetry() {
    setStatus(null);
    setLoadError(null);
    setReloadKey((k) => k + 1);
  }

  async function handleEnter() {
    if (!consent || isSubmitting.current) return;

    isSubmitting.current = true;
    setIsSending(true);
    setSendError(null);

    try {
      setStatus(await registerForRaffle());
      setCelebrateKey((k) => k + 1);
    } catch {
      setSendError("Não foi possível entrar no sorteio. Tente novamente.");
    } finally {
      isSubmitting.current = false;
      setIsSending(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-6">
      {celebrateKey > 0 && <Confetti fireKey={celebrateKey} />}
      {loadError !== null ? (
        <ErrorState onRetry={handleRetry}>{loadError}</ErrorState>
      ) : status === null ? (
        <section aria-busy="true" className="flex flex-col gap-4">
          <Skeleton className="h-8 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <span className="sr-only">Carregando o sorteio…</span>
        </section>
      ) : status.registered ? (
        <section className="flex flex-col items-center gap-3 rounded-3xl bg-surface p-6 text-center shadow-surface">
          <img
            src="/sucesso.gif"
            alt=""
            aria-hidden="true"
            className="h-40 w-auto rounded-2xl object-contain"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
          <PartyPopper aria-hidden="true" className="size-10 text-accent" />
          <h1 className="text-xl font-semibold">Você está participando!</h1>
          <p className="text-muted text-sm text-pretty">
            Seu nome já está no sorteio. Fique de olho no telão: se for
            sorteado, avisaremos por aqui e pelo e-mail da sua conta.
          </p>
        </section>
      ) : (
        <section className="flex flex-col gap-4 rounded-3xl bg-surface p-6 shadow-surface">
          <header className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold">Sorteio do evento</h1>
            <p className="text-muted text-sm text-pretty">
              Use o nome e o e-mail da sua conta do Revi para concorrer. Um
              toque e você já está dentro.
            </p>
          </header>

          <Checkbox isSelected={consent} onChange={setConsent}>
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <span className="text-sm text-pretty">
                Concordo em usar meu nome e meu e-mail para participar e ser
                contatado caso seja sorteado.
              </span>
            </Checkbox.Content>
          </Checkbox>

          {sendError !== null && (
            <p role="alert" className="text-danger text-sm">
              {sendError}
            </p>
          )}

          <Button
            variant="primary"
            isDisabled={!consent || isSending}
            onPress={handleEnter}
          >
            {isSending ? "Entrando…" : "Participar do sorteio"}
          </Button>
        </section>
      )}
    </main>
  );
}
