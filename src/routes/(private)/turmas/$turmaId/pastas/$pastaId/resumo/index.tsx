import { ClassroomStudyPage } from "../components/ClassroomStudyPage";

import { pageMeta } from "@/utils/pageMeta";

export function meta() {
  return pageMeta({
    title: "Resumo da turma",
    description: "A síntese compartilhada da pasta da turma.",
  });
}

export default function ClassroomSummaryPage() { return <ClassroomStudyPage mode="summary" />; }
