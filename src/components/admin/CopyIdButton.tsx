import { Button } from "@heroui/react";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

/** Copia um identificador; o ícone vira um "copiado" por um instante. */
export function CopyIdButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);

    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <Button
      isIconOnly
      size="sm"
      variant="ghost"
      aria-label={copied ? `${label} copiado` : `Copiar ${label}`}
      onPress={() => {
        navigator.clipboard
          .writeText(value)
          .then(() => setCopied(true))
          .catch(() => {});
      }}
    >
      {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
    </Button>
  );
}
