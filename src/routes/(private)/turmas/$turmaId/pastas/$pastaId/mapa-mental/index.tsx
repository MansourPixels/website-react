import { ClassroomStudyPage } from "../components/ClassroomStudyPage";

import { pageMeta } from "@/utils/pageMeta";

export function meta() {
  return pageMeta({
    title: "Mapa mental da turma",
    description:
      "As ideias da pasta compartilhada pela turma ligadas em um mapa.",
  });
}

export default function ClassroomMindMapPage() { return <ClassroomStudyPage mode="map" />; }
