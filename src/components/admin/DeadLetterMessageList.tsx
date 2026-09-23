import { Link } from "react-router";

import type { DeadLetterMessage } from "@/types/api/admin";
import { saoPauloMoment } from "@/utils/adminDates";
import { countOf } from "@/utils/adminFormat";
import { idLabel, reasonLabel } from "@/utils/adminQueues";

import { CopyIdButton } from "./CopyIdButton";

/** As mensagens espiadas de uma fila morta: tipo, ids com botão de copiar, primeira falha e quantas vezes falhou. */
export function DeadLetterMessageList({ messages }: { messages: DeadLetterMessage[] }) {
  if (messages.length === 0) {
    return <p className="text-sm text-muted">A fila está vazia.</p>;
  }

  return (
    <ol className="flex flex-col gap-2">
      {messages.map((message, index) => {
        const ids = Object.entries(message.ids);
        const death = message.firstDeath;

        return (
          // A fila não tem id por mensagem, e a ordem é a da fila.
          <li key={index} className="flex flex-col gap-2 rounded-xl bg-surface p-3 text-sm shadow-surface">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-medium break-all">{message.typeId ?? "Tipo desconhecido"}</span>
              <span className="text-xs text-muted">
                Falhou {countOf(Math.max(message.deathCount, 1), "vez", "vezes")}
              </span>
            </div>

            {ids.length > 0 ? (
              <dl className="flex flex-col gap-1">
                {ids.map(([field, value]) => (
                  <div key={field} className="flex items-center gap-2">
                    <dt className="w-20 shrink-0 text-xs text-muted">{idLabel(field)}</dt>
                    {field === "ownerId" && message.ownerUsername !== null ? (
                      <dd className="min-w-0 flex-1 truncate text-xs" title={value}>
                        <Link
                          to={`/admin/custos/usuarios/${value}`}
                          className="font-medium underline-offset-2 hover:underline"
                        >
                          {message.ownerUsername}
                        </Link>
                      </dd>
                    ) : (
                      <dd className="min-w-0 flex-1 truncate font-mono text-xs" title={value}>
                        {value}
                      </dd>
                    )}
                    <CopyIdButton value={value} label={`id de ${idLabel(field).toLowerCase()}`} />
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-xs text-muted">Sem identificadores no corpo.</p>
            )}

            <p className="text-xs text-muted">
              Primeira falha: {reasonLabel(death?.reason ?? null)}, em {saoPauloMoment(death?.time ?? null)}
              {death?.queue ? <span className="break-all"> ({death.queue})</span> : null}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
