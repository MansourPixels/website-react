import type { StudyPlan } from "@/mocks/performance";
import { Button } from "@heroui/react";
import { CircleStar, Target } from "lucide-react";

interface StudyPlanCardProps {
  plan: StudyPlan;
}

export function StudyPlanCard({ plan }: StudyPlanCardProps) {
  const { discipline, focus, description } = plan;

  return (
    <article className="bg-white rounded-3xl p-4 flex flex-col gap-3">
      <header className="flex flex-col gap-1">
        <h3 className="text-xl font-semibold">{discipline}</h3>
        <p className="flex items-center gap-2 text-sm text-accent">
          <Target className="size-4 shrink-0" />
          {focus}
        </p>
      </header>

      <p className="text-sm flex-1">{description}</p>

      <Button variant="primary" fullWidth>
        <CircleStar />
        Seguir plano de estudos
      </Button>
    </article>
  );
}
