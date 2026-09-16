import { Button, Spinner } from "@heroui/react";
import { Dices } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { ApiError } from "@/api/client";
import { getWhoami, updateAvatar } from "@/api/user";
import { AvatarPicker } from "@/components/AvatarPicker";
import { ErrorState } from "@/components/ErrorState";
import { NavMenu } from "@/components/NavMenu";
import { useFeedback } from "@/hooks/useFeedback";
import { usePreloadedImage } from "@/hooks/usePreloadedImage";
import {
  buildAvatarUrl,
  parseAvatarUrl,
  randomAvatarConfig,
  type AvatarConfig,
} from "@/utils/avatar";

export default function AvatarPage() {
  const navigate = useNavigate();
  const feedback = useFeedback();

  const [config, setConfig] = useState<AvatarConfig | null>(null);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  // `true` quando `config` foi sorteado como ponto de partida (avatar salvo é
  // um seed do backend, sem como virar peças do catálogo) em vez de refletir
  // o avatar salvo de verdade. Nesse caso a prévia mostra `savedUrl` — o
  // avatar real — até o aluno mexer em algo; só então passa a derivar de
  // `config`, senão a prévia mostraria uma cara que não é a do usuário. E
  // enquanto isso durar, salvar fica bloqueado: o que está na tela e o que
  // seria gravado são avatares diferentes.
  const [isPlaceholderConfig, setIsPlaceholderConfig] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setConfig(null);
    setSavedUrl(null);
    setIsPlaceholderConfig(false);
    setLoadError(null);

    getWhoami()
      .then(({ avatarUrl }) => {
        if (cancelled) return;

        const stored = parseAvatarUrl(avatarUrl);

        setConfig(stored ?? randomAvatarConfig());
        setIsPlaceholderConfig(stored === null);
        setSavedUrl(avatarUrl);
      })
      .catch((error) => {
        // Sem saber qual é o avatar atual não dá para montar a tela: partir de
        // uma configuração sorteada em silêncio esconderia a falha.
        if (cancelled) return;

        setLoadError(
          error instanceof ApiError
            ? error.detail
            : "Não foi possível carregar o seu avatar.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // A URL nunca vira estado próprio: ela é sempre derivada da configuração, o
  // que impede as duas de saírem de sincronia.
  const url = config === null ? null : buildAvatarUrl(config);
  const previewUrl = isPlaceholderConfig ? savedUrl : url;
  const preview = usePreloadedImage(previewUrl);

  // `usePreloadedImage` trata falha como sucesso (entrega o `src` mesmo assim),
  // então quem detecta o erro é o próprio `<img>` da tela.
  const [hasPreviewError, setHasPreviewError] = useState(false);

  useEffect(() => {
    setHasPreviewError(false);
  }, [previewUrl]);

  function patch(next: Partial<AvatarConfig>) {
    setConfig((current) => (current === null ? current : { ...current, ...next }));
    setIsPlaceholderConfig(false);
    setSaveError(null);
  }

  async function handleSave() {
    if (url === null) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      await updateAvatar(url);
      feedback("sucesso");
      navigate("/perfil");
    } catch (error) {
      feedback("erro");
      setSaveError(
        error instanceof ApiError
          ? error.detail
          : "Não foi possível salvar o avatar. Tente novamente.",
      );
      setIsSaving(false);
    }
  }

  if (loadError !== null) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
        <NavMenu title="Seu avatar" hasBackButton backHref="/perfil" />
        <ErrorState onRetry={() => setReloadKey((k) => k + 1)}>
          {loadError}
        </ErrorState>
      </main>
    );
  }

  if (config === null) {
    return (
      <div className="flex flex-1 items-center justify-center p-6" aria-busy="true">
        <Spinner size="lg" />
        <span className="sr-only">Carregando o seu avatar…</span>
      </div>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
      <NavMenu title="Seu avatar" hasBackButton backHref="/perfil" />

      <section className="flex flex-col items-center gap-4 rounded-3xl bg-surface p-6 shadow-surface">
        <div className="relative size-40 overflow-hidden rounded-3xl bg-default">
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

          {preview.isLoading ? (
            <span className="absolute inset-0 flex items-center justify-center bg-surface/40">
              <Spinner size="sm" />
            </span>
          ) : null}
        </div>

        <Button variant="secondary" onPress={() => patch(randomAvatarConfig())}>
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
      </section>

      <AvatarPicker config={config} onChange={patch} />

      {saveError !== null ? (
        <p role="alert" className="text-danger-soft-foreground text-sm text-pretty">
          {saveError}
        </p>
      ) : null}

      {/* `/perfil/avatar` é rota de detalhe e não exibe a barra inferior, então
          a barra de ação fica desobstruída no rodapé. */}
      <div className="sticky bottom-0 -mx-6 -mb-6 flex flex-col gap-2 border-t bg-surface/85 px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] backdrop-blur">
        {isPlaceholderConfig ? (
          <p className="text-muted text-xs text-pretty">
            A prévia mostra o seu avatar atual. Escolha uma peça ou toque em
            Surpreenda-me para montar um novo.
          </p>
        ) : null}

        <Button
          variant="primary"
          size="lg"
          className="w-full sm:w-fit"
          // Enquanto a configuração é só um ponto de partida sorteado, a prévia
          // mostra o avatar salvo e `url` aponta para outra cara: salvar aqui
          // gravaria um rosto que o aluno nunca viu.
          isDisabled={isPlaceholderConfig || hasPreviewError || url === savedUrl}
          isPending={isSaving}
          onPress={() => void handleSave()}
        >
          Salvar avatar
        </Button>
      </div>
    </main>
  );
}
