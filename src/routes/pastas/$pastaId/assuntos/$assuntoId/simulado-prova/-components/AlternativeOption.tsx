import { cn } from "@heroui/react";
import type { ReactNode } from "react";

interface AlternativeOptionProps {
  letter: string;
  children: ReactNode;
  isSelected: boolean;
  onSelect: () => void;
}

export function AlternativeOption({
  letter,
  children,
  isSelected,
  onSelect,
}: AlternativeOptionProps) {
  return (
    <label
      className={cn(
        "flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border-2 cursor-pointer transition-colors",
        isSelected
          ? "border-orange-600 bg-orange-50"
          : "border-transparent hover:border-orange-300",
      )}
    >
      <input
        type="radio"
        name="resposta"
        value={letter}
        checked={isSelected}
        onChange={onSelect}
        required
        className="sr-only"
      />
      <strong
        className={cn(
          "size-8 shrink-0 rounded-full flex items-center justify-center font-semibold transition-colors",
          isSelected ? "bg-orange-600 text-white" : "bg-zinc-100",
        )}
      >
        {letter}
      </strong>
      <span className="flex-1 text-left">{children}</span>
    </label>
  );
}
