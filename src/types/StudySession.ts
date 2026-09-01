export type SessionPhase = "focus" | "shortBreak" | "longBreak";

export type SessionStatus = "idle" | "running" | "paused";

export interface SessionSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  cyclesUntilLongBreak: number;
  autoStart: boolean;
  controlsSpotify: boolean;
}

export const DEFAULT_SESSION_SETTINGS: SessionSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesUntilLongBreak: 4,
  autoStart: false,
  controlsSpotify: true,
};

export const SESSION_LIMITS = {
  focusMinutes: { min: 5, max: 90, step: 5 },
  shortBreakMinutes: { min: 1, max: 30, step: 1 },
  longBreakMinutes: { min: 5, max: 60, step: 5 },
  cyclesUntilLongBreak: { min: 2, max: 8, step: 1 },
} as const;

export interface SessionRunState {
  phase: SessionPhase;
  status: SessionStatus;
  endsAt: number | null;
  remainingMs: number;
  cycleInRound: number;
}

export interface SessionCounter {
  date: string;
  completedFocus: number;
}

export interface StoredStudySession {
  settings: SessionSettings;
  counter: SessionCounter;
  run?: SessionRunState;
}
