import { cn } from "@heroui/react";
import { Ban } from "lucide-react";

import {
  avatarCharacteristics,
  avatarPreviewSrc,
  type AvatarGroup,
} from "@/utils/avatar";

/**
 * Só o grupo que oferece "nenhum" admite `null`. Amarrar as duas coisas na
 * mesma união evita que os grupos obrigatórios tenham de checar um `null` que
 * nunca chega.
 */
type AvatarOptionGridProps<T extends string> = {
  group: AvatarGroup;
  legend: string;
} & (
  | { value: T; onChange: (value: T) => void; noneLabel?: undefined }
  | { value: T | null; onChange: (value: T | null) => void; noneLabel: string }
);

export function AvatarOptionGrid<T extends string>({
  group,
  legend,
  value,
  onChange,
  noneLabel,
}: AvatarOptionGridProps<T>) {
  const variants = Object.entries(avatarCharacteristics[group]) as [T, string][];

  // A união acima descreve os dois contratos para quem chama; aqui dentro o
  // `null` só é emitido pelo tile que a própria `noneLabel` cria.
  const emit = onChange as (value: T | null) => void;

  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
        {noneLabel !== undefined ? (
          <OptionTile
            group={group}
            label={noneLabel}
            isSelected={value === null}
            onSelect={() => emit(null)}
          >
            <Ban className="size-5 text-muted" aria-hidden="true" />
          </OptionTile>
        ) : null}

        {variants.map(([variant, label]) => (
          <OptionTile
            key={variant}
            group={group}
            label={label}
            isSelected={value === variant}
            onSelect={() => emit(variant)}
          >
            <img
              src={avatarPreviewSrc(group, variant)}
              alt=""
              loading="lazy"
              className="size-full object-contain"
            />
          </OptionTile>
        ))}
      </div>
    </fieldset>
  );
}

interface OptionTileProps {
  group: AvatarGroup;
  label: string;
  isSelected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}

function OptionTile({
  group,
  label,
  isSelected,
  onSelect,
  children,
}: OptionTileProps) {
  return (
    <label
      className={cn(
        "flex aspect-square cursor-pointer items-center justify-center rounded-2xl border-2 bg-default p-2 transition-colors",
        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
        isSelected
          ? "border-accent bg-accent-soft"
          : "border-transparent hover:border-accent/30",
      )}
    >
      {/* Radio nativo: dá navegação por setas e o papel correto de graça. O
          rótulo fica só aqui — visível na grade, ele competiria com a imagem. */}
      <input
        type="radio"
        name={`avatar-${group}`}
        checked={isSelected}
        onChange={onSelect}
        className="sr-only"
      />
      <span className="sr-only">{label}</span>
      {children}
    </label>
  );
}
