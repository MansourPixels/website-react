import { Button, Spinner } from "@heroui/react";
import { Dices } from "lucide-react";
import { useEffect, useState } from "react";

import { AvatarPicker } from "@/components/AvatarPicker";
import { usePreloadedImage } from "@/hooks/usePreloadedImage";
import {
  buildAvatarUrl,
  randomAvatarConfig,
  type AvatarConfig,
} from "@/utils/avatar";

interface StepAvatarProps {
  config: AvatarConfig | null;
  onChange: (changes: Partial<AvatarConfig>) => void;
  onReplace: (config: AvatarConfig) => void;
  error: string | null;
}

/**
 * Diferente de `/perfil/avatar`, aqui não existe o estado "configuração é só um
 * ponto de partida sorteado": a conta acabou de nascer, o avatar salvo é o seed
 * `?seed=<ownerId>` do backend e `parseAvatarUrl` devolve `null` para ele de
 * propósito. Então a prévia sempre deriva de `config`, e salvar nunca grava um
 * rosto que o aluno não viu.
 */
export function StepAvatar({
  config,
  onChange,
  onReplace,
  error,
}: StepAvatarProps) {
  const url = config === null ? null : buildAvatarUrl(config);
  const preview = usePreloadedImage(url);

  // `usePreloadedImage` entrega o `src` mesmo em falha, então quem detecta o
  // erro é o próprio `<img>`.
  const [hasPreviewError, setHasPreviewError] = useState(false);

  useEffect(() => {
    setHasPreviewError(false);
  }, [url]);

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-balance">Monte o seu rosto</h1>
        <p className="text-muted text-sm text-pretty">
          É como a turma vai te reconhecer no ranking e nas suas turmas. Dá para
          mudar quando quiser, no Perfil.
        </p>
      </header>

      <div className="flex flex-col items-center gap-4">
        <div className="relative size-32 overflow-hidden rounded-3xl bg-default">
          {preview.src !== null && !hasPreviewError ? (
            <img
              src={preview.src}
              alt="Prévia do seu avatar"
              className="size-full object-cover"
              onError={() => setHasPreviewError(true)}
            />
          ) : null}

          {hasPreviewError ? (
            <p className="text-muted absolute inset-0 flex items-center justify-center p-3 text-center text-xs text-pretty">
              Não foi possível carregar a prévia
            </p>
          ) : null}

          {preview.isLoading || config === null ? (
            <span className="absolute inset-0 flex items-center justify-center bg-surface/40">
              <Spinner size="sm" />
            </span>
          ) : null}
        </div>

        <Button
          variant="secondary"
          isDisabled={config === null}
          onPress={() => onReplace(randomAvatarConfig())}
        >
          <Dices className="size-4" />
          Surpreenda-me
        </Button>

        <p aria-live="polite" className="sr-only">
          {hasPreviewError
            ? "Não foi possível carregar a prévia do avatar."
            : preview.isLoading
              ? "Atualizando o avatar…"
              : "Avatar atualizado."}
        </p>
      </div>

      {config !== null ? (
        <AvatarPicker
          config={config}
          onChange={onChange}
          className="rounded-2xl bg-background p-3"
        />
      ) : null}

      {error !== null ? (
        <p role="alert" className="text-danger-soft-foreground text-sm text-pretty">
          {error}
        </p>
      ) : null}
    </>
  );
}
