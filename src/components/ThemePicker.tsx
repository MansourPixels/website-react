import { Label, ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { Monitor, Moon, Sun } from "lucide-react";

import type { ThemePreference } from "@/utils/themeStorage";

const options = [
  { id: "light", label: "Claro", icon: Sun },
  { id: "dark", label: "Escuro", icon: Moon },
  { id: "system", label: "Sistema", icon: Monitor },
] as const;

interface ThemePickerProps {
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
}

/**
 * `ToggleButtonGroup`, e não `Tabs`: tema não troca um painel de conteúdo, é
 * uma escolha de configuração exclusiva — a semântica de abas não se aplica.
 */
export function ThemePicker({ value, onChange }: ThemePickerProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      <Label>Tema</Label>
      <ToggleButtonGroup
        fullWidth
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={[value]}
        onSelectionChange={(keys) => {
          const [next] = keys;

          if (next !== undefined) onChange(next as ThemePreference);
        }}
      >
        {options.map(({ id, label, icon: Icon }) => (
          <ToggleButton key={id} id={id} className="flex-1 gap-1.5">
            <Icon className="size-4" />
            {label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  );
}
