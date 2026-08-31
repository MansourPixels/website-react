import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  DEFAULT_SESSION_SETTINGS,
  type SessionCounter,
  type SessionPhase,
  type SessionRunState,
  type SessionSettings,
} from "@/types/StudySession";
import { unlockAudio } from "@/utils/sound";
import { useFeedback } from "./useFeedback";
import {
  readStudySession,
  sanitizeSettings,
  todayKey,
  writeStudySession,
} from "@/utils/sessionStorage";

const TICK_MS = 250;

const MAX_AUTO_START_OVERSHOOT_MS = 60_000;

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
  persist?: boolean;
  /** Desligado no widget da landing: página de marketing não emite som. */
  feedback?: boolean;
}

export function useStudySession({
  persist = true,
  feedback: isFeedbackEnabled = true,
}: UseStudySessionOptions = {}) {
  const feedback = useFeedback();
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

  const [nowMs, setNowMs] = useState(0);

  const handledDeadline = useRef<number | null>(null);

  const remainingMs =
    run.status === "running" && run.endsAt !== null
      ? Math.max(0, run.endsAt - nowMs)
      : run.remainingMs;

  const totalMs = durationOf(run.phase, settings);

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

  useEffect(() => {
    if (run.status !== "running") return;

    setNowMs(Date.now());

    const id = window.setInterval(() => setNowMs(Date.now()), TICK_MS);

    return () => window.clearInterval(id);
  }, [run.status, run.endsAt]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    function handleVisibility() {
      if (document.visibilityState === "visible") setNowMs(Date.now());
    }

    document.addEventListener("visibilitychange", handleVisibility);

    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

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

    const finishedRound = wasFocus && nextPhase === "longBreak";

    if (isFeedbackEnabled) {
      feedback(
        finishedRound
          ? "sessao-ciclo-concluido"
          : wasFocus
            ? "sessao-foco-concluido"
            : "sessao-pausa-concluida",
      );
    }

    setAnnouncement(
      finishedRound
        ? `Ciclo ${nextCycleInRound} concluído. Hora da pausa longa.`
        : announce(nextPhase, settings),
    );
  }, [run, remainingMs, settings, feedback, isFeedbackEnabled]);

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
    unlockAudio();

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
