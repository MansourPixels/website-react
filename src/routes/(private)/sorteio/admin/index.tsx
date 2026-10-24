import { Button, Skeleton } from "@heroui/react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";

import {
  drawRaffleWinner,
  listRaffleEntries,
  probeRaffleAdmin,
} from "@/api/raffle";
import { ErrorState } from "@/components/ErrorState";
import { NavMenu } from "@/components/NavMenu";
import NotFoundPage from "@/routes/(not-found)/index";
import type { RaffleEntries, RaffleEntry } from "@/types/api/raffle";
import { pageMeta } from "@/utils/pageMeta";

export function meta() {
  return pageMeta({
    title: "Sorteio — organização",
    description: "Lista de participantes e sorteio do evento.",
  });
}

// `denied` mostra a mesma tela de "página não encontrada" de qualquer endereço
// que não existe: quem não tem a role não fica sabendo que esta tela existe.
type Access = "checking" | "allowed" | "denied" | "error";

export default function SorteioAdminPage() {
  const [access, setAccess] = useState<Access>("checking");
  const [entries, setEntries] = useState<RaffleEntries | null>(null);
  const [winner, setWinner] = useState<RaffleEntry | null>(null);
  const [drawError, setDrawError] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    probeRaffleAdmin(controller.signal)
      .then(async (allowed) => {
        if (controller.signal.aborted) return;

        if (!allowed) {
          setAccess("denied");

          return;
        }

        const list = await listRaffleEntries(controller.signal);

        if (controller.signal.aborted) return;

        setEntries(list);
        setAccess("allowed");
      })
      .catch(() => {
        if (controller.signal.aborted) return;

        setAccess("error");
      });

    return () => controller.abort();
  }, [reloadKey]);

  function handleRetry() {
    setAccess("checking");
    setReloadKey((k) => k + 1);
  }

  async function handleDraw() {
    if (isDrawingRef.current) return;

    isDrawingRef.current = true;
    setIsDrawing(true);
    setDrawError(null);

    try {
      const picked = await drawRaffleWinner();

      setWinner(picked);
      // Atualiza a lista para mostrar quem já foi sorteado.
      setEntries(await listRaffleEntries());
    } catch (error) {
      const status = (error as { status?: number }).status;

      setDrawError(
        status === 409
          ? "Não há mais participantes para sortear."
          : "Não foi possível sortear agora. Tente novamente.",
      );
    } finally {
      isDrawingRef.current = false;
      setIsDrawing(false);
    }
  }

  if (access === "denied") return <NotFoundPage />;

  // Leva para a landing, que abre o modal de cadastro do sorteio pelo parâmetro.
  const entryUrl = `${window.location.origin}/?sorteio=true`;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <NavMenu title="Sorteio" />

      {access === "error" ? (
        <ErrorState onRetry={handleRetry}>
          Não foi possível carregar o sorteio.
        </ErrorState>
      ) : access === "checking" || entries === null ? (
        <section aria-busy="true" className="flex flex-col gap-4">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
          <span className="sr-only">Carregando o sorteio…</span>
        </section>
      ) : (
        <>
          <section className="flex flex-col items-center gap-3 rounded-3xl bg-surface p-6 text-center shadow-surface">
            <h2 className="font-semibold">Aponte a câmera para entrar</h2>
            {/* Fundo branco fixo: o leitor de QR precisa do contraste, e o
                tema escuro inverteria as cores. */}
            <div className="rounded-2xl bg-white p-4">
              <QRCodeSVG value={entryUrl} size={224} marginSize={0} />
            </div>
            <p className="text-muted text-xs break-all">{entryUrl}</p>
          </section>

          <section className="flex flex-col gap-4 rounded-3xl bg-surface p-6 shadow-surface">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold">
                {entries.total}{" "}
                {entries.total === 1 ? "participante" : "participantes"}
              </h2>
              <Button
                variant="primary"
                isDisabled={isDrawing || entries.total === 0}
                onPress={handleDraw}
              >
                {isDrawing ? "Sorteando…" : "Sortear"}
              </Button>
            </header>

            {drawError !== null && (
              <p role="alert" className="text-danger text-sm">
                {drawError}
              </p>
            )}

            {winner !== null && (
              <div
                role="status"
                className="flex flex-col gap-1 rounded-2xl bg-accent/10 p-4"
              >
                <p className="text-muted text-xs">Sorteado</p>
                <p className="text-2xl font-semibold break-words">
                  {winner.displayName}
                </p>
                <p className="text-sm break-all">
                  {winner.email ?? "Sem e-mail verificado"}
                </p>
                {/* Para quem acabou de criar a conta, o e-mail ainda não está
                    verificado: o Instagram é o canal para avisar o sorteado. */}
                {winner.instagram !== null && (
                  <p className="text-sm break-all">@{winner.instagram}</p>
                )}
              </div>
            )}

            <ul className="flex flex-col gap-2">
              {entries.entries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-background p-3"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">
                      {entry.displayName}
                    </span>
                    <span className="text-muted truncate text-xs">
                      {entry.email ?? "Sem e-mail verificado"}
                      {entry.instagram !== null && ` · @${entry.instagram}`}
                    </span>
                  </div>
                  {entry.drawn && (
                    <span className="text-accent shrink-0 text-xs font-medium">
                      Sorteado
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
