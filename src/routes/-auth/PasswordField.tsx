import { Button, InputGroup, Label, TextField } from "@heroui/react";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  hint?: string;
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete = "current-password",
  hint,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <TextField className="w-full" type={isVisible ? "text" : "password"}>
      <Label htmlFor={id}>{label}</Label>
      <InputGroup fullWidth>
        <InputGroup.Input
          id={id}
          value={value}
          autoComplete={autoComplete}
          placeholder="••••••••"
          onChange={(event) => onChange(event.target.value)}
        />
        <InputGroup.Suffix>
          <Button
            type="button"
            isIconOnly
            variant="ghost"
            size="sm"
            aria-label={isVisible ? "Ocultar senha" : "Mostrar senha"}
            onPress={() => setIsVisible(!isVisible)}
          >
            {isVisible ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </Button>
        </InputGroup.Suffix>
      </InputGroup>
      {hint ? <p className="text-muted text-sm">{hint}</p> : null}
    </TextField>
  );
}
