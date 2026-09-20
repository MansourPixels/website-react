import { Button } from "@heroui/react";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

import { ApiError } from "@/api/client";
import { regenerateMediaArtifacts } from "@/api/media";

interface RegenerateArtifactsProps {
  contentId: string;
  /** Depois do `202`: quem chama limpa o que estava na tela e volta a consultar. */
  onRegenerated: () => void;
}

/**
 * "Gerar de novo": recria o simulado, os flashcards e o mapa mental do áudio.
 * Pede confirmação porque troca o que já existe, e é também a saída de uma
 * geração que falhou (artefatos derivados não têm status próprio).
 */
export function RegenerateArtifacts({ contentId, onRegenerated }: RegenerateArtifactsProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setIsRequesting(true);
    setError(null);

    try {
      await regenerateMediaArtifacts(contentId);
      setIsConfirming(false);
      onRegenerated();
    } catch (caught) {
      setError(messageFor(caught));
    } finally {
      setIsRequesting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {isConfirming ? (
        <div role="group" aria-label="Confirmar nova geração" className="flex flex-wrap items-center justify-end gap-2">
          <p className="text-muted text-sm text-pretty">
            Isso troca o simulado, os flashcards e o mapa mental.
          </p>
          <Button size="sm" onPress={confirm} isDisabled={isRequesting}>
            {isRequesting ? "Pedindo..." : "Gerar de novo"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => {
              setIsConfirming(false);
              setError(null);
            }}
            isDisabled={isRequesting}
          >
            Cancelar
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="secondary" onPress={() => setIsConfirming(true)}>
          <RefreshCw />
          Gerar de novo
        </Button>
      )}
      {error !== null ? (
        <p role="alert" className="text-danger text-sm text-pretty">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return "O áudio ainda está sendo processado ou não tem fala para gerar. Tente quando ele estiver pronto.";
    }

    return error.detail;
  }

  return "Não foi possível pedir a geração. Tente novamente.";
}
