import { Button } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";

import { unsubscribeWithToken } from "@/api/notifications";
import { AuthCard } from "@/components/AuthCard";
import {
  unsubscribeOutcomeFor,
  type UnsubscribeOutcome,
} from "@/utils/notificationPreferences";
import { pageMeta } from "@/utils/pageMeta";

export function meta() {
  return [
    ...pageMeta({
      title: "Parar de receber e-mails",
      description:
        "Deixe de receber um tipo de e-mail do Revi a partir do link da mensagem.",
    }),
    // O token viaja na query string. Sem Referer nenhum, ele não chega a
    // terceiro algum, nem pelas fontes que o `root` carrega.
    { name: "referrer", content: "no-referrer" },
  ];
}

// `idle` é a confirmação; `sending` e `done` são a chamada em andamento e o
// sucesso; o resto é o desfecho de `unsubscribeOutcomeFor`.
type Phase = "idle" | "sending" | "done" | UnsubscribeOutcome;

const MESSAGES: Partial<Record<Phase, string>> = {
  done: "Pronto. Você não vai mais receber e-mails deste tipo.",
  "invalid-link":
    "Este link não é válido ou já foi substituído. Você pode ajustar as suas preferências pelo app.",
  "rate-limited": "Muitas tentativas. Tente novamente em instantes.",
  network: "Não foi possível concluir agora.",
};

const PREFERENCES_LINK_CLASS = buttonVariants({
  variant: "ghost",
  size: "sm",
  className: "text-accent",
});

export default function DescadastrarPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [phase, setPhase] = useState<Phase>("idle");
  // O botão já fica desabilitado enquanto envia, mas um segundo toque pode
  // chegar antes da renderização que o desabilita; a ref fecha essa janela.
  const isSubmitting = useRef(false);

  // A página não chama a API ao carregar: um verificador de link que executa
  // JavaScript descadastraria a pessoa sem ela ter pedido. Só o botão envia.
  async function handleConfirm() {
    if (token === null || isSubmitting.current) return;

    isSubmitting.current = true;
    setPhase("sending");

    try {
      await unsubscribeWithToken(token);
      setPhase("done");
    } catch (error) {
      // Sem `console`: o token não pode parar no console. A mensagem sai do
      // status, nunca do `detail` do servidor.
      setPhase(unsubscribeOutcomeFor(error));
    } finally {
      isSubmitting.current = false;
    }
  }

  if (token === null || token.trim().length === 0) {
    return (
      <AuthCard>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Este link não é válido.</h1>
        </div>

        <Link to="/" className={buttonVariants({ className: "w-full" })}>
          Ir para o início
        </Link>
      </AuthCard>
    );
  }

  const message = MESSAGES[phase];
  const isFinished = phase === "done" || phase === "invalid-link";

  return (
    <AuthCard>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-balance">
          Parar de receber estes e-mails?
        </h1>
        {!isFinished ? (
          <p className="text-muted text-sm text-pretty">
            Só este tipo de e-mail deixa de chegar. Os outros e as mensagens da
            sua conta continuam.
          </p>
        ) : null}
      </div>

      {/* Sempre no DOM: uma região `status` só anuncia o que muda dentro dela. */}
      <div role="status">
        {message !== undefined ? (
          <p
            className={
              phase === "done"
                ? "text-sm text-pretty"
                : "text-danger-soft-foreground text-sm text-pretty"
            }
          >
            {message}
          </p>
        ) : null}
      </div>

      {!isFinished ? (
        <Button
          className="w-full"
          isPending={phase === "sending"}
          onPress={() => void handleConfirm()}
        >
          {phase === "network" ? "Tentar novamente" : "Sim, parar de receber"}
        </Button>
      ) : null}

      <p className="text-center text-sm">
        <Link to="/perfil/notificacoes" className={PREFERENCES_LINK_CLASS}>
          Gerenciar preferências
        </Link>
      </p>
    </AuthCard>
  );
}
