import { findStudyPlan, type PlanStep } from "@/mocks/studyPlans";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface PlanProgress {
  total: number;
  completed: number;
  isComplete: boolean;
  isStarted: boolean;
  nextStep: PlanStep | null;
  completedStepIds: string[];
}

interface StudyPlanContextValue {
  activePlanId: string | null;
  followPlan: (planId: string) => void;
  resumePlan: (planId: string) => void;
  leavePlan: () => void;
  completeStep: (planId: string, stepId: string) => void;
  restartPlan: (planId: string) => void;
  getProgress: (planId: string) => PlanProgress;
}

const StudyPlanContext = createContext<StudyPlanContextValue | null>(null);

const emptySteps: string[] = [];

export function StudyPlanProvider({ children }: { children: ReactNode }) {
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [completedByPlan, setCompletedByPlan] = useState<
    Record<string, string[]>
  >({});

  const getProgress = useCallback(
    (planId: string): PlanProgress => {
      const plan = findStudyPlan(planId);
      const steps = plan?.steps ?? [];
      const completedStepIds = completedByPlan[planId] ?? emptySteps;
      const completed = steps.filter((step) =>
        completedStepIds.includes(step.id),
      ).length;

      return {
        total: steps.length,
        completed,
        isComplete: steps.length > 0 && completed === steps.length,
        isStarted: completed > 0,
        nextStep:
          steps.find((step) => !completedStepIds.includes(step.id)) ?? null,
        completedStepIds,
      };
    },
    [completedByPlan],
  );

  const followPlan = useCallback((planId: string) => {
    setActivePlanId(planId);
    setCompletedByPlan((previous) => {
      const plan = findStudyPlan(planId);
      const done = previous[planId] ?? emptySteps;
      const isComplete =
        plan !== undefined &&
        plan.steps.length > 0 &&
        plan.steps.every((step) => done.includes(step.id));

      if (!isComplete) return previous;

      return { ...previous, [planId]: [] };
    });
  }, []);

  const resumePlan = useCallback(
    (planId: string) => setActivePlanId(planId),
    [],
  );

  const leavePlan = useCallback(() => setActivePlanId(null), []);

  const completeStep = useCallback((planId: string, stepId: string) => {
    setCompletedByPlan((previous) => {
      const done = previous[planId] ?? emptySteps;

      if (done.includes(stepId)) return previous;

      return { ...previous, [planId]: [...done, stepId] };
    });
  }, []);

  const restartPlan = useCallback((planId: string) => {
    setCompletedByPlan((previous) => ({ ...previous, [planId]: [] }));
  }, []);

  const value = useMemo(
    () => ({
      activePlanId,
      followPlan,
      resumePlan,
      leavePlan,
      completeStep,
      restartPlan,
      getProgress,
    }),
    [
      activePlanId,
      followPlan,
      resumePlan,
      leavePlan,
      completeStep,
      restartPlan,
      getProgress,
    ],
  );

  return (
    <StudyPlanContext.Provider value={value}>
      {children}
    </StudyPlanContext.Provider>
  );
}

export function useStudyPlans() {
  const context = useContext(StudyPlanContext);

  if (context === null) {
    throw new Error("useStudyPlans precisa estar dentro de StudyPlanProvider");
  }

  return context;
}
