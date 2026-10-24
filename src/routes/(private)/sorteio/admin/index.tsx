import { Button, cn, Skeleton } from "@heroui/react";
import { Maximize, Minimize, RefreshCw, Trophy, Users } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  drawRaffleWinner,
  listRaffleEntries,
  probeRaffleAdmin,
} from "@/api/raffle";
import { ErrorState } from "@/components/ErrorState";
import { useScreenWakeLock } from "@/hooks/useScreenWakeLock";
import NotFoundPage from "@/routes/(not-found)/index";
import type { RaffleEntries, RaffleEntry } from "@/types/api/raffle";
import { pageMeta } from "@/utils/pageMeta";

import { AutoScrollList } from "./components/AutoScrollList";
import { DrawCountdown } from "./components/DrawCountdown";
import { WinnerReveal } from "./components/WinnerReveal";

export function meta() {
  return pageMeta({
    title: "Sorteio — organização",
    description: "Lista de participantes e sorteio do evento.",
  });
}

const PRIZE = "uma Alexa";
const COUNTDOWN_SECONDS = 5;
const REFRESH_INTERVAL_MS = 60_000;
// Quanto tempo o selo "+N novas inscrições" fica na tela depois da última
// atualização que trouxe gente nova.
const NEWCOMERS_BADGE_MS = 10_000;
const CURSOR_IDLE_MS = 3_000;

const timeFormat = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

// `denied` mostra a mesma tela de "página não encontrada" de qualquer endereço
// que não existe: quem não tem a role não fica sabendo que esta tela existe.
type Access = "checking" | "allowed" | "denied" | "error";

type DrawOutcome =
  | { ok: true; winner: RaffleEntry }
  | { ok: false; message: string };

function toggleFullscreen() {
  if (document.fullscreenElement) {
    void document.exitFullscreen().catch(() => {});
  } else {
    void document.documentElement.requestFullscreen().catch(() => {});
  }
}

/**
 * Tela feita para ser transmitida numa TV no evento: tamanhos em função da
 * altura/largura da tela (lidos do fundo do salão), lista que rola sozinha e
 * se atualiza a cada minuto, e o sorteio com contagem e revelação em tela
 * cheia. Os e-mails não aparecem em lugar nenhum dela, porque o salão inteiro
 * está olhando.
 *
 * Atalhos para quem opera do notebook: Espaço (ou Enter) sorteia e F alterna
 * a tela cheia — desde que o foco não esteja num botão, que trata as próprias
 * teclas.
 */
export default function SorteioAdminPage() {
  const [access, setAccess] = useState<Access>("checking");
  const [entries, setEntries] = useState<RaffleEntries | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [newcomers, setNewcomers] = useState(0);
  // `null` até a primeira carga: quem já estava inscrito quando a tela abriu
  // não conta como "nova inscrição".
  const knownIdsRef = useRef<Set<string> | null>(null);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [revealed, setRevealed] = useState<RaffleEntry | null>(null);
  const [drawError, setDrawError] = useState<string | null>(null);
  // A requisição do sorteio sai junto com o início da contagem, para a espera
  // da rede ficar escondida atrás dela. Também serve de trava contra um
  // segundo sorteio enquanto o primeiro não terminou.
  const drawRef = useRef<Promise<DrawOutcome> | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCursorIdle, setIsCursorIdle] = useState(false);

  useScreenWakeLock(access === "allowed");

  const applyList = useCallback((list: RaffleEntries) => {
    const known = knownIdsRef.current;

    if (known !== null) {
      const fresh = list.entries.filter((entry) => !known.has(entry.id));

      if (fresh.length > 0) setNewcomers((count) => count + fresh.length);
    }

    knownIdsRef.current = new Set(list.entries.map((entry) => entry.id));
    setEntries(list);
    setLastUpdatedAt(new Date());
    setRefreshFailed(false);
  }, []);

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

        applyList(list);
        setAccess("allowed");
      })
      .catch(() => {
        if (controller.signal.aborted) return;

        setAccess("error");
      });

    return () => controller.abort();
  }, [reloadKey, applyList]);

  const refreshEntries = useCallback(async () => {
    setIsRefreshing(true);

    try {
      applyList(await listRaffleEntries());
    } catch {
      // A lista anterior continua na tela; a próxima rodada tenta de novo.
      setRefreshFailed(true);
    } finally {
      setIsRefreshing(false);
    }
  }, [applyList]);

  useEffect(() => {
    if (access !== "allowed") return;

    const id = window.setInterval(() => {
      void refreshEntries();
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [access, refreshEntries]);

  useEffect(() => {
    if (newcomers === 0) return;

    const id = window.setTimeout(() => setNewcomers(0), NEWCOMERS_BADGE_MS);

    return () => window.clearTimeout(id);
  }, [newcomers]);

  const startDraw = useCallback(() => {
    if (drawRef.current !== null) return;

    setDrawError(null);
    setRevealed(null);
    drawRef.current = drawRaffleWinner().then(
      (winner): DrawOutcome => ({ ok: true, winner }),
      (error: unknown): DrawOutcome => ({
        ok: false,
        message:
          (error as { status?: number }).status === 409
            ? "Não há mais participantes para sortear."
            : "Não foi possível sortear agora. Tente novamente.",
      }),
    );
    setCountdown(COUNTDOWN_SECONDS);
  }, []);

  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const id = window.setTimeout(() => setCountdown(countdown - 1), 1000);

      return () => window.clearTimeout(id);
    }

    // Contagem no zero: revela assim que a resposta chegar (quase sempre já
    // chegou, porque saiu cinco segundos antes).
    const pending = drawRef.current;
    if (pending === null) return;

    let cancelled = false;

    void pending.then((outcome) => {
      if (cancelled) return;

      drawRef.current = null;
      setCountdown(null);

      if (!outcome.ok) {
        setDrawError(outcome.message);
        return;
      }

      setRevealed(outcome.winner);
      // Marca o sorteado na hora, sem esperar a lista voltar do servidor.
      setEntries(
        (current) =>
          current && {
            ...current,
            entries: current.entries.map((entry) =>
              entry.id === outcome.winner.id ? outcome.winner : entry,
            ),
          },
      );
      void refreshEntries();
    });

    return () => {
      cancelled = true;
    };
  }, [countdown, refreshEntries]);

  const closeReveal = useCallback(() => setRevealed(null), []);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement !== null);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Na TV, a seta do mouse parada no meio da tela atrapalha: em tela cheia,
  // ela some depois de alguns segundos sem movimento.
  useEffect(() => {
    if (!isFullscreen) return;

    let id = window.setTimeout(() => setIsCursorIdle(true), CURSOR_IDLE_MS);

    function handlePointerMove() {
      setIsCursorIdle(false);
      window.clearTimeout(id);
      id = window.setTimeout(() => setIsCursorIdle(true), CURSOR_IDLE_MS);
    }

    window.addEventListener("pointermove", handlePointerMove);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [isFullscreen]);

  const undrawnCount =
    entries?.entries.filter((entry) => !entry.drawn).length ?? 0;
  const canDraw = countdown === null && undrawnCount > 0;

  useEffect(() => {
    if (access !== "allowed") return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      // Com o foco num controle, a tecla é dele: o botão "Sortear" focado já
      // sorteia com Espaço, e dispararia duas vezes.
      const target = event.target as HTMLElement | null;
      if (target?.closest("button, a, input, textarea, select")) return;

      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        toggleFullscreen();
      } else if (event.key === " " || event.key === "Enter") {
        if (!canDraw || revealed !== null) return;

        event.preventDefault();
        startDraw();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [access, canDraw, revealed, startDraw]);

  function handleRetry() {
    setAccess("checking");
    setReloadKey((k) => k + 1);
  }

  if (access === "denied") return <NotFoundPage />;

  // Leva para a landing, que abre o modal de cadastro do sorteio pelo parâmetro.
  const entryUrl = `${window.location.origin}/?sorteio=true`;
  const displayUrl = entryUrl.replace(/^https?:\/\//, "");

  const winners =
    entries?.entries
      .filter((entry) => entry.drawn)
      .sort((a, b) => (b.drawnAt ?? "").localeCompare(a.drawnAt ?? "")) ?? [];

  return (
    <main
      className={cn(
        "flex min-h-dvh flex-col gap-[2.5vh] p-[clamp(1rem,3vh,2.5rem)] lg:h-dvh lg:overflow-hidden",
        isFullscreen && isCursorIdle && "cursor-none",
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-[clamp(0.75rem,1.2vw,1.5rem)]">
          <img
            src="/logo.svg"
            alt=""
            className="size-[clamp(2.5rem,7vh,5rem)] shrink-0"
          />
          <div className="flex min-w-0 flex-col">
            <span className="text-muted text-[clamp(0.875rem,1.4vw,1.5rem)] font-medium">
              Revi
            </span>
            <h1 className="text-[clamp(1.5rem,3.2vw,3.5rem)] leading-tight font-bold">
              Sorteio de {PRIZE}
            </h1>
          </div>
        </div>

        {access === "allowed" && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted text-[clamp(0.75rem,1.1vw,1.125rem)]">
              {isRefreshing
                ? "Atualizando…"
                : refreshFailed
                  ? "Sem conexão: tento de novo em 1 min"
                  : lastUpdatedAt !== null &&
                    `Atualizado às ${timeFormat.format(lastUpdatedAt)}`}
            </span>
            <Button
              isIconOnly
              variant="ghost"
              aria-label="Atualizar a lista agora"
              isDisabled={isRefreshing}
              onPress={() => void refreshEntries()}
            >
              <RefreshCw
                className={cn("size-5", isRefreshing && "animate-spin")}
              />
            </Button>
            <Button
              isIconOnly
              variant="ghost"
              aria-label={isFullscreen ? "Sair da tela cheia (F)" : "Tela cheia (F)"}
              onPress={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize className="size-5" />
              ) : (
                <Maximize className="size-5" />
              )}
            </Button>
            <Button size="lg" isDisabled={!canDraw} onPress={startDraw}>
              <Trophy className="size-5" />
              Sortear
              <kbd className="hidden rounded-md bg-accent-foreground/20 px-1.5 text-xs font-medium lg:inline">
                Espaço
              </kbd>
            </Button>
          </div>
        )}
      </header>

      {drawError !== null && (
        <p
          role="alert"
          className="text-danger text-[clamp(0.875rem,1.4vw,1.5rem)] font-medium"
        >
          {drawError}
        </p>
      )}

      {access === "error" ? (
        <div className="flex flex-1 items-center justify-center">
          <ErrorState onRetry={handleRetry}>
            Não foi possível carregar o sorteio.
          </ErrorState>
        </div>
      ) : access === "checking" || entries === null ? (
        <div
          aria-busy="true"
          className="grid flex-1 gap-[2.5vh] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-[2vw]"
        >
          <Skeleton className="min-h-64 rounded-[2rem]" />
          <Skeleton className="min-h-64 rounded-[2rem]" />
          <span className="sr-only">Carregando o sorteio…</span>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 gap-[2.5vh] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-[2vw]">
          <section
            aria-labelledby="sorteio-participar"
            className="flex min-h-0 flex-col items-center justify-center gap-[2.5vh] rounded-[2rem] bg-surface p-[clamp(1.25rem,3vh,3rem)] text-center shadow-surface"
          >
            <h2
              id="sorteio-participar"
              className="text-[clamp(1.25rem,2.4vw,2.75rem)] leading-tight font-semibold text-balance"
            >
              Aponte a câmera e participe
            </h2>
            {/* Fundo branco fixo: o leitor de QR precisa do contraste, e o
                tema escuro inverteria as cores. */}
            <div className="aspect-square w-[min(100%,44vh)] shrink-0 rounded-3xl bg-white p-[4%]">
              <QRCodeSVG
                value={entryUrl}
                size={512}
                marginSize={0}
                className="size-full"
              />
            </div>
            <p className="text-muted text-[clamp(0.875rem,1.3vw,1.5rem)] break-all">
              {displayUrl}
            </p>

            <div className="flex flex-col items-center">
              <span className="text-[clamp(3rem,11vh,9rem)] leading-none font-bold tabular-nums">
                {entries.total}
              </span>
              <span className="text-muted text-[clamp(1rem,2vw,2.25rem)]">
                {entries.total === 1 ? "inscrito" : "inscritos"}
              </span>
            </div>
            {/* Altura reservada: o selo entra e sai sem empurrar o resto. */}
            <div className="flex h-[clamp(2rem,4.5vh,3.5rem)] items-center">
              {newcomers > 0 && (
                <span
                  role="status"
                  className="celebrate rounded-full bg-accent-soft px-[1em] py-[0.25em] text-[clamp(0.875rem,1.5vw,1.75rem)] font-semibold text-accent-soft-foreground"
                >
                  +{newcomers}{" "}
                  {newcomers === 1 ? "nova inscrição" : "novas inscrições"}
                </span>
              )}
            </div>
          </section>

          <section
            aria-labelledby="sorteio-inscritos"
            className="flex min-h-[60vh] flex-col gap-[2vh] rounded-[2rem] bg-surface p-[clamp(1.25rem,3vh,3rem)] shadow-surface lg:min-h-0"
          >
            <header className="flex flex-wrap items-baseline justify-between gap-x-4">
              <h2
                id="sorteio-inscritos"
                className="text-[clamp(1.25rem,2.4vw,2.75rem)] font-semibold"
              >
                Inscritos
              </h2>
              <span className="text-muted text-[clamp(0.75rem,1.2vw,1.375rem)]">
                Mais recentes primeiro
              </span>
            </header>

            {entries.total === 0 ? (
              <div className="text-muted flex flex-1 flex-col items-center justify-center gap-4 text-center">
                <Users
                  aria-hidden="true"
                  className="size-[clamp(3rem,8vh,6rem)]"
                />
                <p className="max-w-[24ch] text-[clamp(1rem,2vw,2.25rem)] text-balance">
                  Ninguém por aqui ainda. Aponte a câmera para o QR code e seja
                  o primeiro!
                </p>
              </div>
            ) : (
              <AutoScrollList
                className="flex-1"
                items={entries.entries}
                getKey={(entry) => entry.id}
                renderItem={(entry) => <EntryRow entry={entry} />}
              />
            )}

            {winners.length > 0 && (
              <footer className="flex flex-col gap-[1vh] border-t pt-[2vh]">
                <h3 className="text-muted text-[clamp(0.75rem,1.1vw,1.25rem)] font-semibold tracking-wider uppercase">
                  Já sorteados
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {winners.map((winner) => (
                    <li
                      key={winner.id}
                      className="flex items-center gap-2 rounded-full bg-accent-soft px-[1em] py-[0.35em] text-[clamp(0.875rem,1.4vw,1.5rem)] font-semibold text-accent-soft-foreground"
                    >
                      <Trophy aria-hidden="true" className="size-[1em]" />
                      {winner.displayName}
                      {winner.instagram !== null && (
                        <span className="font-normal opacity-80">
                          @{winner.instagram}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </footer>
            )}
          </section>
        </div>
      )}

      {countdown !== null && (
        <DrawCountdown
          value={countdown}
          totalSeconds={COUNTDOWN_SECONDS}
          prize={PRIZE}
        />
      )}

      {revealed !== null && (
        <WinnerReveal
          winner={revealed}
          prize={PRIZE}
          onClose={closeReveal}
          onDrawAgain={startDraw}
          canDrawAgain={undrawnCount > 0}
        />
      )}
    </main>
  );
}

function EntryRow({ entry }: { entry: RaffleEntry }) {
  const initial = entry.displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className={cn(
        "flex items-center gap-[clamp(0.75rem,1vw,1.25rem)] rounded-2xl px-[clamp(0.75rem,1.2vw,1.5rem)] py-[clamp(0.5rem,1.2vh,1rem)]",
        entry.drawn ? "bg-accent-soft" : "bg-background",
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-[clamp(2.25rem,5.5vh,4rem)] shrink-0 items-center justify-center rounded-full bg-accent text-[clamp(1rem,1.8vw,1.75rem)] font-semibold text-accent-foreground"
      >
        {initial}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[clamp(1rem,1.8vw,2rem)] font-semibold">
          {entry.displayName}
        </span>
        {entry.instagram !== null && (
          <span className="text-muted truncate text-[clamp(0.875rem,1.3vw,1.5rem)]">
            @{entry.instagram}
          </span>
        )}
      </div>
      {entry.drawn && (
        <span className="text-accent flex shrink-0 items-center gap-1.5 text-[clamp(0.875rem,1.3vw,1.5rem)] font-semibold">
          <Trophy aria-hidden="true" className="size-[1em]" />
          Sorteado
        </span>
      )}
    </div>
  );
}
