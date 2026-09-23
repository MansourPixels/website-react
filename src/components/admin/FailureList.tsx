import type { RecordedFailure } from "@/types/api/admin";
import { saoPauloMoment } from "@/utils/adminDates";
import { failureSourceLabel } from "@/utils/adminQueues";

import { CopyIdButton } from "./CopyIdButton";

/** As falhas registradas: tabela no desktop, cartões no celular; o erro abre com "ver mais". */
export function FailureList({ failures }: { failures: RecordedFailure[] }) {
  return (
    <>
      <table className="hidden w-full table-fixed text-sm md:table">
        <thead className="text-left text-xs text-muted">
          <tr>
            <th className="w-36 py-2 font-medium">Quando</th>
            <th className="w-28 py-2 font-medium">Origem</th>
            <th className="py-2 font-medium">Arquivo</th>
            <th className="py-2 font-medium">Erro</th>
          </tr>
        </thead>
        <tbody>
          {failures.map((failure) => (
            <tr key={`${failure.source}-${failure.contentId}-${failure.failedAt}`} className="border-t align-top">
              <td className="py-2 tabular-nums">{saoPauloMoment(failure.failedAt)}</td>
              <td className="py-2">{failureSourceLabel(failure.source)}</td>
              <td className="py-2 pr-3">
                <FileCell failure={failure} />
              </td>
              <td className="py-2">
                <ErrorText message={failure.errorMessage} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="flex flex-col gap-2 md:hidden">
        {failures.map((failure) => (
          <li
            key={`${failure.source}-${failure.contentId}-${failure.failedAt}`}
            className="flex flex-col gap-2 rounded-xl bg-surface p-3 text-sm shadow-surface"
          >
            <div className="flex items-baseline justify-between gap-2 text-xs text-muted">
              <span>{failureSourceLabel(failure.source)}</span>
              <span className="tabular-nums">{saoPauloMoment(failure.failedAt)}</span>
            </div>
            <FileCell failure={failure} />
            <ErrorText message={failure.errorMessage} />
          </li>
        ))}
      </ul>
    </>
  );
}

function FileCell({ failure }: { failure: RecordedFailure }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="truncate font-medium" title={failure.fileName ?? undefined}>
        {failure.fileName ?? "Arquivo sem nome"}
      </span>
      {failure.contentType ? <span className="truncate text-xs text-muted">{failure.contentType}</span> : null}
      <span className="flex min-w-0 items-center gap-1">
        <span className="min-w-0 truncate font-mono text-xs text-muted" title={failure.contentId}>
          {failure.contentId}
        </span>
        <CopyIdButton value={failure.contentId} label="id do material" />
      </span>
    </div>
  );
}

const SHORT_ERROR = 140;

function ErrorText({ message }: { message: string | null }) {
  if (message === null || message.trim() === "") {
    return <span className="text-muted">Sem mensagem de erro.</span>;
  }

  if (message.length <= SHORT_ERROR) {
    return <span className="break-words">{message}</span>;
  }

  return (
    <details className="group">
      <summary className="cursor-pointer list-none break-words">
        <span className="group-open:hidden">{message.slice(0, SHORT_ERROR)}… </span>
        <span className="text-xs font-medium text-accent underline-offset-2 hover:underline">
          <span className="group-open:hidden">ver mais</span>
          <span className="hidden group-open:inline">ver menos</span>
        </span>
      </summary>
      <p className="mt-1 break-words whitespace-pre-wrap">{message}</p>
    </details>
  );
}
