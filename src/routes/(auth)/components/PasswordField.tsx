import { Button, ErrorMessage, InputGroup, Label, TextField } from "@heroui/react";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  hint?: string;
  errorMessage?: string | null;
  onBlur?: () => void;
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete = "current-password",
  hint,
  errorMessage,
  onBlur,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <TextField
      className="w-full"
      type={isVisible ? "text" : "password"}
      isInvalid={Boolean(errorMessage)}
    >
      <Label htmlFor={id}>{label}</Label>
      <InputGroup fullWidth>
        <InputGroup.Input
          id={id}
          value={value}
          autoComplete={autoComplete}
          placeholder="••••••••"
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className="w-full"
        />
        <InputGroup.Suffix className="px-1">
          {/* O botão sai do raio `rounded-3xl` padrão (que num quadrado de
              44px vira círculo e vaza pelos cantos do campo) e recupera os
              44px de alvo de toque por um `::after` transparente. */}
          <Button
            type="button"
            isIconOnly
            variant="ghost"
            size="sm"
            className="rounded-field after:absolute after:-inset-1 after:content-['']"
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
      {errorMessage ? (
        <ErrorMessage>{errorMessage}</ErrorMessage>
      ) : hint ? (
        <p className="text-muted text-sm">{hint}</p>
      ) : null}
    </TextField>
  );
}
