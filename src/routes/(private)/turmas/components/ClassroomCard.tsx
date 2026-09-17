import { Link } from "react-router";

import type { Classroom } from "@/types/api/classroom";
import { roleLabel } from "@/utils/classroomPermissions";

interface ClassroomCardProps {
  classroom: Classroom;
  /** Mesma prop do `FolderCover`: a landing já tem o `h2` da seção. */
  titleAs?: "h2" | "p";
  /** Destino alternativo: na landing o cartão é demonstração e leva ao cadastro. */
  to?: string;
}

export function ClassroomCard({
  classroom,
  titleAs: Title = "h2",
  to = `/turmas/${classroom.id}`,
}: ClassroomCardProps) {
  return (
    <article className="group h-full hover:brightness-105">
      <Link
        to={to}
        className="bg-surface shadow-surface flex h-full flex-col overflow-hidden rounded-3xl transition-all active:scale-98 motion-reduce:transition-none"
      >
        <div
          className="h-20 w-full"
          style={{ backgroundColor: classroom.color }}
        />

        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <Title className="line-clamp-2 font-semibold break-words text-balance">
              {classroom.name}
            </Title>
            <span className="bg-default text-muted shrink-0 rounded-full px-2 py-0.5 text-xs">
              {roleLabel(classroom.role)}
            </span>
          </div>

          {classroom.description.length > 0 ? (
            <p className="text-muted line-clamp-2 text-xs text-pretty">
              {classroom.description}
            </p>
          ) : null}

          <p className="text-muted mt-auto text-xs tabular-nums">
            {classroom.memberCount}{" "}
            {classroom.memberCount === 1 ? "membro" : "membros"} ·{" "}
            {classroom.folderCount}{" "}
            {classroom.folderCount === 1 ? "pasta" : "pastas"}
          </p>
        </div>
      </Link>
    </article>
  );
}
