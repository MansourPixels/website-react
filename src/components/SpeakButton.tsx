import { Button, cn } from "@heroui/react";
import { Square, Volume2, VolumeX } from "lucide-react";

import { useSpeech } from "@/hooks/useSpeech";

interface SpeakButtonProps {
  /**
   * O texto a falar. Função quando montá-lo é caro ou depende do estado no
   * momento do clique — assim nada é calculado a cada render.
   */
  text: string | (() => string);
  /** Completa o rótulo: "Ouvir {label}". */
  label: string;
  size?: "sm" | "lg";
  className?: string;
}

/**
 * O botão de áudio compartilhado pelas telas de estudo e pelo texto de OCR.
 *
 * É a única forma de disparar leitura na interface — o `useSpeech` cru fica
 * reservado à leitura automática.
 */
export function SpeakButton({
  text,
  label,
  size = "lg",
  className,
}: SpeakButtonProps) {
  const { isSupported, isSpeaking, toggle } = useSpeech();

  // Botão desabilitado não recebe hover no react-aria, então um tooltip aqui
  // nunca apareceria: a explicação mora no `aria-label` e na tela de Perfil.
  if (!isSupported) {
    return (
      <Button
        isIconOnly
        isDisabled
        variant="tertiary"
        size={size}
        aria-label="Leitura em voz alta indisponível neste navegador"
        className={cn("shrink-0", className)}
      >
        <VolumeX className={size === "sm" ? "size-4" : "size-5"} />
      </Button>
    );
  }

  return (
    <Button
      isIconOnly
      variant={isSpeaking ? "primary" : "tertiary"}
      size={size}
      aria-label={isSpeaking ? "Parar a leitura" : `Ouvir ${label}`}
      className={cn("shrink-0", className)}
      onPress={() => toggle(typeof text === "function" ? text() : text)}
    >
      {isSpeaking ? (
        <Square className={size === "sm" ? "size-4" : "size-5"} />
      ) : (
        <Volume2 className={size === "sm" ? "size-4" : "size-5"} />
      )}
    </Button>
  );
}
