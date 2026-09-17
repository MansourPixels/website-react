import { ClassroomStudyPage } from "../components/ClassroomStudyPage";

import { pageMeta } from "@/utils/pageMeta";

export function meta() {
  return pageMeta({
    title: "Simulado da turma",
    description:
      "Pratique com as perguntas geradas a partir da pasta compartilhada pela turma.",
  });
}

export default function ClassroomQuizPage() { return <ClassroomStudyPage mode="quiz" />; }
