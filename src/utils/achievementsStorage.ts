export interface SeenAchievements {
  /** Metas de sequência (em dias) que o aluno já viu serem conquistadas. */
  reachedMilestones: number[];
  /** Dia em que o "Dia de ouro" já foi celebrado, no formato `AAAA-MM-DD`. */
  lastGoldDate: string | null;
}

const ACHIEVEMENTS_KEY = "revi:conquistas-vistas";

const EMPTY: SeenAchievements = { reachedMilestones: [], lastGoldDate: null };

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
    // Armazenamento cheio ou bloqueado: a conquista pode se repetir depois.
  }
}

export function sanitizeSeenAchievements(value: unknown): SeenAchievements {
  const raw = (value ?? {}) as Partial<SeenAchievements>;

  return {
    reachedMilestones: Array.isArray(raw.reachedMilestones)
      ? raw.reachedMilestones.filter(
          (goal): goal is number =>
            typeof goal === "number" && Number.isFinite(goal),
        )
      : EMPTY.reachedMilestones,
    lastGoldDate:
      typeof raw.lastGoldDate === "string" ? raw.lastGoldDate : null,
  };
}

export function readSeenAchievements(): SeenAchievements {
  return sanitizeSeenAchievements(
    readJson<Partial<SeenAchievements>>(ACHIEVEMENTS_KEY),
  );
}

export function writeSeenAchievements(seen: SeenAchievements) {
  writeJson(ACHIEVEMENTS_KEY, seen);
}
