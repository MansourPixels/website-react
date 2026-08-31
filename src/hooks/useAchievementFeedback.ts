import type { StreakStatus } from "@/types/api/streak";
import {
  readSeenAchievements,
  writeSeenAchievements,
} from "@/utils/achievementsStorage";
import { milestones } from "@/utils/milestones";
import { todayKey } from "@/utils/sessionStorage";
import { useEffect, useRef } from "react";
import { useFeedback } from "./useFeedback";

/**
 * Sequência, metas e "Dia de ouro" são estado derivado do render: o aluno chega
 * na tela e o número já está lá, sem nunca presenciar a conquista. Comparar com
 * o que já foi visto transforma esse estado num evento — uma vez só, na
 * primeira vez que o marco aparece.
 *
 * O registro é por aparelho: a mesma meta celebra de novo em outro celular, e
 * quem nunca abrir a Ascensão nunca vê a celebração.
 */
export function useAchievementFeedback(streak: StreakStatus | null) {
  const feedback = useFeedback();

  // O StrictMode monta o effect duas vezes em desenvolvimento, e o streak chega
  // por promise — sem a trava a conquista dispararia em duplicidade.
  const handled = useRef(false);

  useEffect(() => {
    if (streak === null || handled.current) return;

    handled.current = true;

    const seen = readSeenAchievements();
    const today = todayKey();

    const reached = milestones
      .map(({ goal }) => goal)
      .filter((goal) => streak.currentStreak >= goal);

    const isNewMilestone = reached.some(
      (goal) => !seen.reachedMilestones.includes(goal),
    );
    const isNewGold = streak.todayIsGold && seen.lastGoldDate !== today;

    // Uma celebração por visita: cruzar duas metas de uma vez não vira dois
    // sons sobrepostos, e a conquista maior tem precedência.
    if (isNewMilestone) feedback("conquista");
    else if (isNewGold) feedback("dia-de-ouro");

    writeSeenAchievements({
      reachedMilestones: reached,
      lastGoldDate: streak.todayIsGold ? today : seen.lastGoldDate,
    });
  }, [streak, feedback]);
}
