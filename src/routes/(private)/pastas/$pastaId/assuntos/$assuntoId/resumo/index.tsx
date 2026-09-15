import { Spinner, buttonVariants } from "@heroui/react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { ApiError } from "@/api/client";
import { getSummary } from "@/api/summary";
import { NavMenu } from "@/components/NavMenu";
import { SpeakButton } from "@/components/SpeakButton";
import type { FolderSummary } from "@/types/api/summary";
import { normalizeLatexDelimiters } from "@/utils/markdown";
import { markdownToSpeech } from "@/utils/speechText";
import { formatUploadDate } from "@/utils/time";

export default function SummaryPage() {
  const { assuntoId } = useParams<"pastaId" | "assuntoId">() as {
    pastaId: string;
    assuntoId: string;
  };

  // undefined = ainda carregando; null = 404 (nenhum resumo gerado ainda).
  const [summary, setSummary] = useState<FolderSummary | null | undefined>(
    undefined,
  );
  const [loadError, setLoadError] = useState<string | null>(null);

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
  }, [assuntoId]);

  return (
    <main className="content-bg-purple-200 flex-1 flex flex-col">
      <div className="p-6 md:p-8 gap-8 flex flex-col w-full max-w-3xl mx-auto">
        <NavMenu
          title="Resumo"
          hasBackButton
          action={
            summary !== null && summary !== undefined ? (
              <SpeakButton
                label="o resumo"
                // Função: converter o markdown inteiro só vale a pena no clique.
                text={() => markdownToSpeech(summary.markdown)}
              />
            ) : null
          }
        />

        {loadError !== null ? (
          <p className="text-danger text-center py-8">{loadError}</p>
        ) : summary === undefined ? (
          <div
            className="flex flex-1 items-center justify-center p-6"
            aria-busy="true"
          >
            <Spinner size="lg" />
            <span className="sr-only">Carregando resumo</span>
          </div>
        ) : summary === null ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <p className="text-muted">
              Ainda não há resumo para este assunto. Envie conteúdo primeiro
              para que o Revi IA possa gerá-lo.
            </p>
            <Link to="/capturar" className={buttonVariants({})}>
              Capturar material
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-surface p-4 md:p-8 rounded-2xl shadow-surface prose-sm md:prose-base [&_math]:mx-auto prose-headings:font-semibold grid prose-zinc prose-ul:list-disc prose-ol:list-decimal prose-strong:font-semibold prose-h2:mt-4 prose-h2:mb-2">
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
          </>
        )}
      </div>
    </main>
  );
}
