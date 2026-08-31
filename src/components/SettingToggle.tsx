import { Label, Switch } from "@heroui/react";

interface SettingToggleProps {
  label: string;
  description?: string;
  isSelected: boolean;
  isDisabled?: boolean;
  onChange: (isSelected: boolean) => void;
}

export function SettingToggle({
  label,
  description,
  isSelected,
  isDisabled = false,
  onChange,
}: SettingToggleProps) {
  return (
    <Switch
      isSelected={isSelected}
      isDisabled={isDisabled}
      onChange={onChange}
      className="w-full"
    >
      <Switch.Content>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <span className="flex flex-col">
          <Label>{label}</Label>
          {description ? (
            <span className="text-xs text-muted">{description}</span>
          ) : null}
        </span>
      </Switch.Content>
    </Switch>
  );
}
