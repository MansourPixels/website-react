import { Spinner, buttonVariants } from "@heroui/react";
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { ApiError } from "@/api/client";
import { getSummary } from "@/api/summary";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { NavMenu } from "@/components/NavMenu";
import { readReturnPath } from "../components/StudySummary";
import type { FolderSummary } from "@/types/api/summary";
import { normalizeLatexDelimiters } from "@/utils/markdown";
import { formatUploadDate } from "@/utils/time";

// O `prose` do plugin traz a própria paleta cinza; estas variáveis a
// reamarram aos tokens do tema, que já viram no escuro sozinhos.
const PROSE_TOKENS =
  "[--tw-prose-body:var(--foreground)] [--tw-prose-headings:var(--foreground)] [--tw-prose-bold:var(--foreground)] [--tw-prose-links:var(--accent)] [--tw-prose-quotes:var(--foreground)] [--tw-prose-code:var(--foreground)] [--tw-prose-counters:var(--muted)] [--tw-prose-captions:var(--muted)] [--tw-prose-bullets:var(--border)] [--tw-prose-hr:var(--border)] [--tw-prose-quote-borders:var(--border)] [--tw-prose-th-borders:var(--border)] [--tw-prose-td-borders:var(--border)]";

export default function SummaryPage() {
  const { pastaId, assuntoId } = useParams<"pastaId" | "assuntoId">() as {
    pastaId: string;
    assuntoId: string;
  };

  // undefined = ainda carregando; null = 404 (nenhum resumo gerado ainda).
  const [summary, setSummary] = useState<FolderSummary | null | undefined>(
    undefined,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchParams] = useSearchParams();
  const returnPath = readReturnPath(searchParams.get("retorno"));

  useEffect(() => {
    let cancelled = false;

    setSummary(undefined);
    setLoadError(null);

    getSummary(assuntoId)
      .then((result) => {
        if (!cancelled) setSummary(result);
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        setLoadError(
          error instanceof ApiError
            ? error.detail
            : "Não foi possível carregar o resumo. Tente novamente.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [assuntoId, reloadKey]);

  return (
    <main className="content-bg-purple-200 flex-1 flex flex-col">
      <div className="p-6 md:p-8 gap-8 flex flex-col w-full max-w-3xl mx-auto">
        <NavMenu title="Resumo" hasBackButton className="text-center pr-12" />

        {loadError !== null ? (
          <ErrorState onRetry={() => setReloadKey((k) => k + 1)}>
            {loadError}
          </ErrorState>
        ) : summary === undefined ? (
          <div
            className="flex flex-1 items-center justify-center p-6"
            aria-busy="true"
          >
            <Spinner size="lg" />
            <span className="sr-only">Carregando resumo</span>
          </div>
        ) : summary === null ? (
          <EmptyState
            action={
              <Link
                to="/capturar"
                className={buttonVariants({ variant: "secondary" })}
              >
                Capturar material
              </Link>
            }
          >
            Ainda não há resumo para este assunto. Envie conteúdo primeiro para
            que o Revi IA possa gerá-lo.
          </EmptyState>
        ) : (
          <>
            <div
              className={`bg-surface p-4 md:p-8 rounded-2xl shadow-surface prose max-w-none prose-sm md:prose-base [&_math]:mx-auto prose-headings:font-semibold prose-ul:list-disc prose-ol:list-decimal prose-strong:font-semibold prose-h2:mt-4 prose-h2:mb-2 ${PROSE_TOKENS}`}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {normalizeLatexDelimiters(summary.markdown)}
              </ReactMarkdown>
            </div>
            <p className="text-muted text-center text-sm">
              Gerado {formatUploadDate(summary.generatedAt)}
            </p>

            {/* O resumo não tem "refazer", mas precisa da mesma saída que os
                outros modos oferecem no fim. */}
            <footer className="flex flex-col gap-3 max-w-lg w-full mx-auto">
              <Link
                to={
                  returnPath ?? `/pastas/${pastaId}/assuntos/${assuntoId}`
                }
                className={buttonVariants({ variant: "tertiary", size: "lg" })}
              >
                {returnPath === null ? "Voltar ao assunto" : "Voltar ao plano"}
              </Link>
            </footer>
          </>
        )}
      </div>
    </main>
  );
}
