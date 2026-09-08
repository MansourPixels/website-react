import {
  DEFAULT_SESSION_SETTINGS,
  SESSION_LIMITS,
  type SessionCounter,
  type SessionPhase,
  type SessionRunState,
  type SessionSettings,
  type SessionStatus,
  type StoredStudySession,
} from "@/types/StudySession";

const SESSION_KEY = "revi:sessao-estudos";

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);

    if (raw === null) return null;

    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Armazenamento cheio ou bloqueado: a sessão segue apenas em memória.
  }
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;

  return Math.min(max, Math.max(min, Math.round(value)));
}

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

export function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function sanitizeSettings(value: unknown): SessionSettings {
  const raw = (value ?? {}) as Partial<SessionSettings>;
  const limits = SESSION_LIMITS;

  return {
    focusMinutes: clampNumber(
      raw.focusMinutes,
      limits.focusMinutes.min,
      limits.focusMinutes.max,
      DEFAULT_SESSION_SETTINGS.focusMinutes,
    ),
    shortBreakMinutes: clampNumber(
      raw.shortBreakMinutes,
      limits.shortBreakMinutes.min,
      limits.shortBreakMinutes.max,
      DEFAULT_SESSION_SETTINGS.shortBreakMinutes,
    ),
    longBreakMinutes: clampNumber(
      raw.longBreakMinutes,
      limits.longBreakMinutes.min,
      limits.longBreakMinutes.max,
      DEFAULT_SESSION_SETTINGS.longBreakMinutes,
    ),
    cyclesUntilLongBreak: clampNumber(
      raw.cyclesUntilLongBreak,
      limits.cyclesUntilLongBreak.min,
      limits.cyclesUntilLongBreak.max,
      DEFAULT_SESSION_SETTINGS.cyclesUntilLongBreak,
    ),
    autoStart: readBoolean(raw.autoStart, DEFAULT_SESSION_SETTINGS.autoStart),
    controlsSpotify: readBoolean(
      raw.controlsSpotify,
      DEFAULT_SESSION_SETTINGS.controlsSpotify,
    ),
  };
}

const phases: SessionPhase[] = ["focus", "shortBreak", "longBreak"];
const statuses: SessionStatus[] = ["idle", "running", "paused"];

function sanitizeRun(value: unknown): SessionRunState | undefined {
  const raw = value as Partial<SessionRunState> | undefined;

  if (
    raw === undefined ||
    raw === null ||
    !phases.includes(raw.phase as SessionPhase) ||
    !statuses.includes(raw.status as SessionStatus) ||
    typeof raw.remainingMs !== "number" ||
    !Number.isFinite(raw.remainingMs) ||
    typeof raw.cycleInRound !== "number" ||
    !Number.isFinite(raw.cycleInRound)
  ) {
    return undefined;
  }

  const endsAt =
    typeof raw.endsAt === "number" && Number.isFinite(raw.endsAt)
      ? raw.endsAt
      : null;

  return {
    phase: raw.phase as SessionPhase,
    status: raw.status as SessionStatus,
    endsAt,
    remainingMs: Math.max(0, raw.remainingMs),
    cycleInRound: Math.max(0, Math.round(raw.cycleInRound)),
  };
}

function sanitizeCounter(value: unknown): SessionCounter {
  const raw = value as Partial<SessionCounter> | undefined;
  const today = todayKey();

  if (
    raw === undefined ||
    raw === null ||
    typeof raw.date !== "string" ||
    raw.date !== today ||
    typeof raw.completedFocus !== "number" ||
    !Number.isFinite(raw.completedFocus)
  ) {
    return { date: today, completedFocus: 0 };
  }

  return { date: today, completedFocus: Math.max(0, Math.round(raw.completedFocus)) };
}

export function readStudySession(): StoredStudySession {
  const stored = readJson<Partial<StoredStudySession>>(SESSION_KEY);

  return {
    settings: sanitizeSettings(stored?.settings),
    counter: sanitizeCounter(stored?.counter),
    run: sanitizeRun(stored?.run),
  };
}

export function writeStudySession(session: StoredStudySession) {
  writeJson(SESSION_KEY, session);
}
