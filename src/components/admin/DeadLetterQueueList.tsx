import { Button, cn } from "@heroui/react";
import { useState } from "react";

import type { DeadLetterQueue } from "@/types/api/admin";
import { countOf } from "@/utils/adminFormat";
import { queueLabel, sortQueues } from "@/utils/adminQueues";

interface DeadLetterQueueListProps {
  queues: DeadLetterQueue[];
  selected: string | null;
  onSelect: (name: string) => void;
}

/** As filas mortas, as com mensagens primeiro e destacadas; as vazias ficam recolhidas. */
export function DeadLetterQueueList({ queues, selected, onSelect }: DeadLetterQueueListProps) {
  const sorted = sortQueues(queues);
  const full = sorted.filter((queue) => queue.messages > 0);
  const empty = sorted.filter((queue) => queue.messages === 0);
  const [showEmpty, setShowEmpty] = useState(false);
  // A fila aberta aparece mesmo vazia (depois de reenviar tudo, por exemplo).
  const visible = showEmpty ? sorted : [...full, ...empty.filter((queue) => queue.name === selected)];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted" aria-live="polite">
        {full.length === 0
          ? "Nenhuma fila morta com mensagens. Nada falhou de vez."
          : `${countOf(full.length, "fila com mensagens", "filas com mensagens")} de ${queues.length}.`}
      </p>

      {visible.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {visible.map((queue) => (
            <li key={queue.name}>
              <button
                type="button"
                aria-current={queue.name === selected ? "true" : undefined}
                onClick={() => onSelect(queue.name)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-xl bg-surface p-3 text-left shadow-surface outline-none",
                  "focus-visible:ring-2 focus-visible:ring-focus",
                  queue.name === selected && "ring-2 ring-accent",
                )}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="font-medium text-pretty">{queueLabel(queue.name)}</span>
                  <span className="truncate text-xs text-muted">{queue.name}</span>
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
                    queue.messages > 0 ? "bg-warning-soft text-warning" : "bg-default text-muted",
                  )}
                >
                  {countOf(queue.messages, "mensagem", "mensagens")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {empty.length > 0 ? (
        <Button size="sm" variant="ghost" className="self-start" onPress={() => setShowEmpty((shown) => !shown)}>
          {showEmpty ? "Esconder filas vazias" : `Mostrar filas vazias (${empty.length})`}
        </Button>
      ) : null}
    </div>
  );
}
