import { Button } from "@heroui/react";
import { cn } from "@heroui/styles";
import { useState } from "react";

import { PERIOD_PRESETS, type ReportPeriodChoice } from "@/utils/adminPeriod";

interface PeriodPickerProps {
  value: ReportPeriodChoice;
  onChange: (period: ReportPeriodChoice) => void;
  /** O dia de hoje em São Paulo, o limite das datas personalizadas. */
  today: string;
}

/** Atalhos de período e um intervalo personalizado (datas de São Paulo, o fim incluído). */
export function PeriodPicker({ value, onChange, today }: PeriodPickerProps) {
  const [custom, setCustom] = useState(
    value.preset === "personalizado" ? { de: value.de, ate: value.ate } : { de: "", ate: "" },
  );
  const [isCustomOpen, setIsCustomOpen] = useState(value.preset === "personalizado");
  const canApply = custom.de !== "" && custom.ate !== "" && custom.de <= custom.ate;

  return (
    <div className="flex flex-col gap-2">
      <div role="group" aria-label="Período" className="flex flex-wrap gap-1">
        {PERIOD_PRESETS.map((option) => (
          <Button
            key={option.value}
            size="sm"
            variant={value.preset === option.value ? "primary" : "secondary"}
            aria-pressed={value.preset === option.value}
            onPress={() => {
              setIsCustomOpen(false);
              onChange({ preset: option.value });
            }}
          >
            {option.label}
          </Button>
        ))}
        <Button
          size="sm"
          variant={value.preset === "personalizado" ? "primary" : "secondary"}
          aria-pressed={value.preset === "personalizado"}
          aria-expanded={isCustomOpen}
          onPress={() => setIsCustomOpen((open) => !open)}
        >
          Personalizado
        </Button>
      </div>

      {isCustomOpen ? (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (canApply) onChange({ preset: "personalizado", ...custom });
          }}
        >
          <DateField label="De" value={custom.de} max={today} onChange={(de) => setCustom((c) => ({ ...c, de }))} />
          <DateField label="Até" value={custom.ate} max={today} onChange={(ate) => setCustom((c) => ({ ...c, ate }))} />
          <Button type="submit" size="sm" isDisabled={!canApply}>
            Aplicar
          </Button>
        </form>
      ) : null}
    </div>
  );
}

function DateField({ label, value, max, onChange }: { label: string; value: string; max: string; onChange: (value: string) => void }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted">
      {label}
      <input
        type="date"
        value={value}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className={cn("rounded-lg bg-surface px-2 py-1.5 text-sm text-foreground shadow-surface")}
      />
    </label>
  );
}
