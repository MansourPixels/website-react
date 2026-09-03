import { Label, ToggleButton, ToggleButtonGroup } from "@heroui/react";

import type { Classroom } from "@/types/api/classroom";

interface ClassroomScopePickerProps {
  classrooms: Classroom[];
  value: string;
  onChange: (classroomId: string) => void;
}

/**
 * `ToggleButtonGroup` e não `Select`: a lista costuma ter poucas turmas, e uma
 * fileira rolável mostra todas de uma vez em vez de esconder atrás de um menu.
 */
export function ClassroomScopePicker({
  classrooms,
  value,
  onChange,
}: ClassroomScopePickerProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      <Label>Turma</Label>
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <ToggleButtonGroup
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[value]}
          onSelectionChange={(keys) => {
            const [next] = keys;

            if (next !== undefined) onChange(next as string);
          }}
        >
          {classrooms.map((classroom) => (
            <ToggleButton
              key={classroom.id}
              id={classroom.id}
              className="whitespace-nowrap"
            >
              {classroom.name}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>
    </div>
  );
}
