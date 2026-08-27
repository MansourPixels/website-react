import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  DEFAULT_SESSION_SETTINGS,
  type SessionCounter,
  type SessionPhase,
  type SessionRunState,
  type SessionSettings,
} from "@/types/StudySession";
import { playChime, unlockChime } from "@/utils/chime";
import {
  readStudySession,
  sanitizeSettings,
  todayKey,
  writeStudySession,
} from "@/utils/sessionStorage";

const TICK_MS = 250;

// Voltar para uma sessão abandonada há muito tempo não deve disparar a próxima
// fase sozinho — nem dar play numa playlist para uma pessoa que já saiu.
const MAX_AUTO_START_OVERSHOOT_MS = 60_000;

// Cronômetro guardado há mais de duas horas não é mais o cronômetro de ninguém.
const MAX_RESTORE_AGE_MS = 2 * 60 * 60 * 1000;

export const phaseLabels: Record<SessionPhase, string> = {
  focus: "Foco",
  shortBreak: "Pausa curta",
  longBreak: "Pausa longa",
};

export function durationOf(phase: SessionPhase, settings: SessionSettings) {
  const minutes =
    phase === "focus"
      ? settings.focusMinutes
      : phase === "shortBreak"
        ? settings.shortBreakMinutes
        : settings.longBreakMinutes;

  return minutes * 60_000;
}

function createIdleRun(
  phase: SessionPhase,
  settings: SessionSettings,
): SessionRunState {
  return {
    phase,
    status: "idle",
    endsAt: null,
    remainingMs: durationOf(phase, settings),
    cycleInRound: 0,
  };
}

function announce(phase: SessionPhase, settings: SessionSettings) {
  const minutes = Math.round(durationOf(phase, settings) / 60_000);

  return `${phaseLabels[phase]} iniciado. ${minutes} ${minutes === 1 ? "minuto" : "minutos"}.`;
}

interface UseStudySessionOptions {
  /**
   * A landing page instancia um cronômetro de verdade para demonstração. Sem
   * `persist: false` ela sobrescreveria as preferências de quem já usa /sessao.
   */
  persist?: boolean;
}

export function useStudySession({ persist = true }: UseStudySessionOptions = {}) {
  const [settings, setSettings] = useState<SessionSettings>(
    DEFAULT_SESSION_SETTINGS,
  );
  const [counter, setCounter] = useState<SessionCounter>({
    date: todayKey(),
    completedFocus: 0,
  });
  const [run, setRun] = useState<SessionRunState>(() =>
    createIdleRun("focus", DEFAULT_SESSION_SETTINGS),
  );
  const [announcement, setAnnouncement] = useState("");
  const [isReady, setIsReady] = useState(false);

  // `nowMs` só é escrito dentro de efeitos: nunca lemos o relógio durante o
  // render, senão servidor e cliente divergiriam na hidratação.
  const [nowMs, setNowMs] = useState(0);

  const handledDeadline = useRef<number | null>(null);

  const remainingMs =
    run.status === "running" && run.endsAt !== null
      ? Math.max(0, run.endsAt - nowMs)
      : run.remainingMs;

  const totalMs = durationOf(run.phase, settings);

  // Leitura do armazenamento só no cliente, como faz o AuthContext.
  useEffect(() => {
    const stored = readStudySession();
    const now = Date.now();

    setSettings(stored.settings);
    setCounter(stored.counter);

    const restored = persist ? stored.run : undefined;

    if (restored === undefined || restored.status === "idle") {
      setRun(createIdleRun("focus", stored.settings));
    } else if (
      restored.status === "running" &&
      restored.endsAt !== null &&
      now - restored.endsAt > MAX_RESTORE_AGE_MS
    ) {
      setRun(createIdleRun("focus", stored.settings));
    } else {
      setRun(restored);
    }

    setNowMs(now);
    setIsReady(true);
  }, [persist]);

  // O intervalo não conta o tempo: ele só provoca um novo render para que o
  // restante seja recalculado a partir do instante absoluto guardado em
  // `endsAt`. Estrangulamento de aba em segundo plano não acumula erro.
  useEffect(() => {
    if (run.status !== "running") return;

    setNowMs(Date.now());

    const id = window.setInterval(() => setNowMs(Date.now()), TICK_MS);

    return () => window.clearInterval(id);
  }, [run.status, run.endsAt]);

  // Ao voltar para a aba, recalcula na hora em vez de esperar o próximo tick.
  useEffect(() => {
    if (typeof document === "undefined") return;

    function handleVisibility() {
      if (document.visibilityState === "visible") setNowMs(Date.now());
    }

    document.addEventListener("visibilitychange", handleVisibility);

    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Troca de fase. Roda no efeito, não dentro do intervalo, e é idempotente por
  // prazo para não creditar o mesmo ciclo duas vezes.
  useEffect(() => {
    if (run.status !== "running" || run.endsAt === null) return;
    if (remainingMs > 0) return;
    if (handledDeadline.current === run.endsAt) return;

    handledDeadline.current = run.endsAt;

    const now = Date.now();
    const overshootMs = now - run.endsAt;
    const wasFocus = run.phase === "focus";

    let nextPhase: SessionPhase;
    let nextCycleInRound = run.cycleInRound;

    if (wasFocus) {
      nextCycleInRound = Math.min(
        run.cycleInRound + 1,
        settings.cyclesUntilLongBreak,
      );
      nextPhase =
        nextCycleInRound >= settings.cyclesUntilLongBreak
          ? "longBreak"
          : "shortBreak";
    } else {
      nextPhase = "focus";
      // A rodada só recomeça depois da pausa longa.
      if (run.phase === "longBreak") nextCycleInRound = 0;
    }

    const nextDuration = durationOf(nextPhase, settings);
    const shouldAutoStart =
      settings.autoStart && overshootMs <= MAX_AUTO_START_OVERSHOOT_MS;

    setRun({
      phase: nextPhase,
      status: shouldAutoStart ? "running" : "idle",
      endsAt: shouldAutoStart ? now + nextDuration : null,
      remainingMs: nextDuration,
      cycleInRound: nextCycleInRound,
    });
    setNowMs(now);

    if (wasFocus) {
      const today = todayKey();

      setCounter((current) => ({
        date: today,
        completedFocus:
          (current.date === today ? current.completedFocus : 0) + 1,
      }));
    }

    if (settings.soundEnabled) playChime(wasFocus ? "up" : "down");

    const finishedRound = wasFocus && nextPhase === "longBreak";

    setAnnouncement(
      finishedRound
        ? `Ciclo ${nextCycleInRound} concluído. Hora da pausa longa.`
        : announce(nextPhase, settings),
    );
  }, [run, remainingMs, settings]);

  // Mudar as durações com uma fase em andamento só afeta a fase seguinte; com o
  // cronômetro parado, o valor exibido acompanha na hora.
  useEffect(() => {
    if (!isReady) return;

    setRun((current) => {
      if (current.status !== "idle") return current;

      const total = durationOf(current.phase, settings);

      if (current.remainingMs === total) return current;

      return { ...current, remainingMs: total, endsAt: null };
    });
  }, [settings, isReady]);

  useEffect(() => {
    if (!persist || !isReady) return;

    writeStudySession({ settings, counter, run });
  }, [persist, isReady, settings, counter, run]);

  const start = useCallback(() => {
    unlockChime();

    const now = Date.now();

    handledDeadline.current = null;
    setNowMs(now);

    setRun((current) => {
      if (current.status === "running") return current;

      const remaining =
        current.remainingMs > 0
          ? current.remainingMs
          : durationOf(current.phase, settings);

      return {
        ...current,
        status: "running",
        endsAt: now + remaining,
        remainingMs: remaining,
      };
    });

    setAnnouncement(announce(run.phase, settings));
  }, [run.phase, settings]);

  const pause = useCallback(() => {
    setRun((current) => {
      if (current.status !== "running" || current.endsAt === null) return current;

      return {
        ...current,
        status: "paused",
        endsAt: null,
        remainingMs: Math.max(0, current.endsAt - Date.now()),
      };
    });

    setAnnouncement("Sessão pausada.");
  }, []);

  const toggle = useCallback(() => {
    if (run.status === "running") {
      pause();
    } else {
      start();
    }
  }, [run.status, pause, start]);

  const reset = useCallback(() => {
    handledDeadline.current = null;

    setRun((current) => ({
      ...current,
      status: "idle",
      endsAt: null,
      remainingMs: durationOf(current.phase, settings),
    }));

    setAnnouncement(`${phaseLabels[run.phase]} reiniciado.`);
  }, [run.phase, settings]);

  // Pular não conclui um ciclo: avança a fase e sempre aterrissa parado.
  const skip = useCallback(() => {
    handledDeadline.current = null;

    setRun((current) => {
      let nextPhase: SessionPhase;
      let nextCycleInRound = current.cycleInRound;

      if (current.phase === "focus") {
        nextPhase =
          current.cycleInRound + 1 >= settings.cyclesUntilLongBreak
            ? "longBreak"
            : "shortBreak";
      } else {
        nextPhase = "focus";
        if (current.phase === "longBreak") nextCycleInRound = 0;
      }

      return {
        phase: nextPhase,
        status: "idle",
        endsAt: null,
        remainingMs: durationOf(nextPhase, settings),
        cycleInRound: nextCycleInRound,
      };
    });
  }, [settings]);

  const resetCounter = useCallback(() => {
    setCounter({ date: todayKey(), completedFocus: 0 });
  }, []);

  const updateSettings = useCallback((patch: Partial<SessionSettings>) => {
    setSettings((current) => sanitizeSettings({ ...current, ...patch }));
  }, []);

  const restoreDefaults = useCallback(() => {
    setSettings(DEFAULT_SESSION_SETTINGS);
  }, []);

  return useMemo(
    () => ({
      phase: run.phase,
      status: run.status,
      remainingMs,
      totalMs,
      completedFocus: counter.completedFocus,
      cycleInRound: run.cycleInRound,
      settings,
      announcement,
      isReady,
      start,
      pause,
      toggle,
      reset,
      skip,
      resetCounter,
      updateSettings,
      restoreDefaults,
    }),
    [
      run.phase,
      run.status,
      run.cycleInRound,
      remainingMs,
      totalMs,
      counter.completedFocus,
      settings,
      announcement,
      isReady,
      start,
      pause,
      toggle,
      reset,
      skip,
      resetCounter,
      updateSettings,
      restoreDefaults,
    ],
  );
}

export type StudySession = ReturnType<typeof useStudySession>;
