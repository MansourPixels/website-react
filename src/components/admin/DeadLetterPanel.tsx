import { Button } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

import { discardDeadLetters, peekDeadLetters, replayDeadLetters } from "@/api/admin";
import { useAdminResource } from "@/hooks/useAdminResource";
import type { DeadLetterQueue } from "@/types/api/admin";
import { countOf } from "@/utils/adminFormat";
import { deadLetterActionError } from "@/utils/adminErrors";
import { queueLabel } from "@/utils/adminQueues";

import { AdminBlock } from "./AdminBlock";
import { DeadLetterMessageList } from "./DeadLetterMessageList";
import { type DeadLetterAction, DialogDeadLetterAction } from "./DialogDeadLetterAction";

const PEEK_LIMIT = 20;

interface DeadLetterPanelProps {
  name: string;
  /** A fila na última listagem; `undefined` quando o nome da URL não é uma fila conhecida. */
  queue: DeadLetterQueue | undefined;
  /** Muda a cada "Atualizar" e depois de cada ação, para espiar de novo. */
  refresh: number;
  onClose: () => void;
  /** Uma ação mudou a fila: recarrega a lista e as mensagens. */
  onChanged: () => void;
}

/** O detalhe de uma fila morta: as mensagens espiadas (sem consumir) e as ações de reenviar e descartar. */
export function DeadLetterPanel({ name, queue, refresh, onClose, onChanged }: DeadLetterPanelProps) {
  const [messages, retryMessages] = useAdminResource(
    (signal) => peekDeadLetters(name, PEEK_LIMIT, signal),
    "Não foi possível espiar as mensagens desta fila.",
    `${name}|${refresh}`,
  );
  const [target, setTarget] = useState<{ queue: string; messages: number; action: DeadLetterAction } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [resultFor, setResultFor] = useState(name);

  // Trocar de fila apaga o resultado da ação na fila anterior.
  if (resultFor !== name) {
    setResultFor(name);
    setResult(null);
  }

  const count = queue?.messages ?? 0;

  async function run(queueName: string, action: DeadLetterAction, limit: number) {
    setTarget(null);
    setIsRunning(true);
    setResult(null);

    try {
      if (action === "replay") {
        const { replayed } = await replayDeadLetters(queueName, limit);
        setResult({ tone: "ok", text: `${countOf(replayed, "mensagem reenviada", "mensagens reenviadas")} para o trabalho.` });
      } else {
        const { discarded } = await discardDeadLetters(queueName, limit);
        setResult({ tone: "ok", text: `${countOf(discarded, "mensagem descartada", "mensagens descartadas")}.` });
      }
      onChanged();
    } catch (error) {
      setResult({ tone: "error", text: deadLetterActionError(error) });
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-surface p-4 shadow-surface" aria-label={queueLabel(name)}>
      <Button size="sm" variant="ghost" className="self-start md:hidden" onPress={onClose}>
        <ArrowLeft className="size-4" aria-hidden />
        Voltar para as filas
      </Button>

      <header className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-pretty">{queueLabel(name)}</h2>
        <p className="text-xs break-all text-muted">{name}</p>
        {queue ? (
          <p className="text-xs break-all text-muted">Trabalho: {queue.workQueue}</p>
        ) : null}
        {/* Sem a lista (carregando ou fora do ar), a contagem é desconhecida, não zero. */}
        {queue ? (
          <p className="text-sm tabular-nums" aria-live="polite">
            {countOf(count, "mensagem", "mensagens")} na fila
          </p>
        ) : null}
      </header>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          isDisabled={count === 0 || isRunning}
          onPress={() => setTarget({ queue: name, messages: count, action: "replay" })}
        >
          Reenviar
        </Button>
        <Button
          size="sm"
          variant="danger-soft"
          isDisabled={count === 0 || isRunning}
          onPress={() => setTarget({ queue: name, messages: count, action: "discard" })}
        >
          Descartar
        </Button>
      </div>

      {result !== null ? (
        <p
          role={result.tone === "error" ? "alert" : "status"}
          className={
            result.tone === "error"
              ? "rounded-lg bg-danger-soft p-2 text-sm text-danger"
              : "rounded-lg bg-success-soft p-2 text-sm text-success"
          }
        >
          {result.text}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">
          Mensagens <span className="font-normal text-muted">(as {PEEK_LIMIT} primeiras, sem tirar da fila)</span>
        </h3>
        {/* O RabbitMQ 4 ignora o `x-death` de quem publica, então o reenvio começa um histórico novo. */}
        <p className="text-xs text-muted">A contagem de falhas e a primeira falha recomeçam quando a mensagem é reenviada.</p>
        <AdminBlock resource={messages} onRetry={retryMessages}>
          {(value) => (
            <>
              {/* Espiar tira as mensagens da fila por um instante: outra espiada ao mesmo tempo vê só parte delas. */}
              {value.messages.length < Math.min(count, PEEK_LIMIT) ? (
                <p className="text-xs text-muted text-pretty">
                  Algumas mensagens não vieram: outra pessoa pode estar olhando esta fila agora. Use “Atualizar” para
                  ver todas.
                </p>
              ) : null}
              <DeadLetterMessageList messages={value.messages} />
            </>
          )}
        </AdminBlock>
      </div>

      <DialogDeadLetterAction target={target} onClose={() => setTarget(null)} onConfirm={run} />
    </section>
  );
}
