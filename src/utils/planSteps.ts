import type { PlanStepKind } from "@/mocks/studyPlans";
import { FileText, ListCheck, Zap, type LucideIcon } from "lucide-react";

interface PlanStepKindMeta {
  label: string;
  icon: LucideIcon;
  chip: string;
  fill: string;
  tint: string;
  action: string;
}

export const planStepKinds: Record<PlanStepKind, PlanStepKindMeta> = {
  resumo: {
    label: "Resumo",
    icon: FileText,
    chip: "bg-purple-700",
    fill: "bg-purple-700",
    tint: "content-bg-purple-200",
    action: "Ler o resumo",
  },
  "flash-cards": {
    label: "Flash Cards",
    icon: Zap,
    chip: "bg-emerald-500",
    fill: "bg-emerald-500",
    tint: "content-bg-emerald-200",
    action: "Revisar os cartões",
  },
  simulado: {
    label: "Simulado",
    icon: ListCheck,
    chip: "bg-orange-600",
    fill: "bg-orange-600",
    tint: "content-bg-orange-200",
    action: "Fazer o simulado",
  },
};
