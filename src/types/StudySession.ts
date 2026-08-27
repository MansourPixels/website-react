// Fases do Pomodoro. Os identificadores ficam em inglês para acompanhar o
// restante do código; só o texto de interface é em português.
export type SessionPhase = "focus" | "shortBreak" | "longBreak";

export type SessionStatus = "idle" | "running" | "paused";

export interface SessionSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  cyclesUntilLongBreak: number;
  autoStart: boolean;
  soundEnabled: boolean;
  controlsSpotify: boolean;
}

export const DEFAULT_SESSION_SETTINGS: SessionSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesUntilLongBreak: 4,
  autoStart: false,
  soundEnabled: true,
  controlsSpotify: true,
};

export const SESSION_LIMITS = {
  focusMinutes: { min: 5, max: 90, step: 5 },
  shortBreakMinutes: { min: 1, max: 30, step: 1 },
  longBreakMinutes: { min: 5, max: 60, step: 5 },
  cyclesUntilLongBreak: { min: 2, max: 8, step: 1 },
} as const;

// O cronômetro é guiado por um instante absoluto (`endsAt`), nunca por um
// contador decrementado a cada tick: é isso que o mantém correto quando a aba
// fica em segundo plano e o navegador estrangula os timers.
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
