import { ClassroomStudyPage } from "../components/ClassroomStudyPage";

import { pageMeta } from "@/utils/pageMeta";

export function meta() {
  return pageMeta({
    title: "Flash cards da turma",
    description: "Revise conceitos com os cartões compartilhados pela turma.",
  });
}

export default function ClassroomFlashcardsPage() { return <ClassroomStudyPage mode="flashcards" />; }
