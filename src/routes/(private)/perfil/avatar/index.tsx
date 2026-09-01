import { Button, Spinner, Tabs } from "@heroui/react";
import { Dices } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { getWhoami, updateAvatar } from "@/api/user";
import { NavMenu } from "@/components/NavMenu";
import { useFeedback } from "@/hooks/useFeedback";
import { usePreloadedImage } from "@/hooks/usePreloadedImage";
import {
  buildAvatarUrl,
  defaultBackgroundColors,
  defaultHairColors,
  defaultSkinColors,
  parseAvatarUrl,
  randomAvatarConfig,
  type AccessoriesVariant,
  type AvatarConfig,
  type EyesVariant,
  type HairVariant,
  type MouthVariant,
} from "@/utils/avatar";
import { AvatarColorRow } from "./components/AvatarColorRow";
import { AvatarOptionGrid } from "./components/AvatarOptionGrid";

const avatarTabs = [
  { id: "accessories", label: "Acessórios" },
  { id: "eyes", label: "Olhos" },
  { id: "hair", label: "Cabelo" },
  { id: "mouth", label: "Boca" },
  { id: "colors", label: "Cores" },
];

export default function AvatarPage() {
  const navigate = useNavigate();
  const feedback = useFeedback();

  const [config, setConfig] = useState<AvatarConfig | null>(null);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getWhoami()
      .then(({ avatarUrl }) => {
        if (cancelled) return;

        // Sem avatar guardado é o primeiro acesso: um sorteio dá ao aluno algo
        // já montado para ajustar, em vez de um rosto padrão vazio.
        const stored = avatarUrl === null ? null : parseAvatarUrl(avatarUrl);

        setConfig(stored ?? randomAvatarConfig());
        setSavedUrl(avatarUrl);
      })
      .catch(() => {
        if (!cancelled) setConfig(randomAvatarConfig());
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // A URL nunca vira estado próprio: ela é sempre derivada da configuração, o
  // que impede as duas de saírem de sincronia.
  const url = config === null ? null : buildAvatarUrl(config);
  const preview = usePreloadedImage(url);

  function patch(next: Partial<AvatarConfig>) {
    setConfig((current) => (current === null ? current : { ...current, ...next }));
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
    } catch {
      feedback("erro");
      setSaveError("Não foi possível salvar o avatar. Tente novamente.");
      setIsSaving(false);
    }
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

      <section className="flex flex-col items-center gap-4 rounded-3xl bg-white p-6 shadow-surface">
        <div className="relative size-40 overflow-hidden rounded-3xl bg-default">
          {preview.src !== null ? (
            <img src={preview.src} alt="" className="size-full object-cover" />
          ) : null}

          {preview.isLoading ? (
            <span className="absolute inset-0 flex items-center justify-center bg-white/40">
              <Spinner size="sm" />
            </span>
          ) : null}
        </div>

        <Button variant="secondary" onPress={() => patch(randomAvatarConfig())}>
          <Dices className="size-4" />
          Surpreenda-me
        </Button>

        <p aria-live="polite" className="sr-only">
          {preview.isLoading ? "Atualizando o avatar…" : "Avatar atualizado."}
        </p>
      </section>

      <Tabs
        defaultSelectedKey="accessories"
        className="rounded-3xl bg-white p-4 shadow-surface"
      >
        {/* `ListContainer` traz a rolagem horizontal com as setas de overflow:
            as cinco abas não cabem lado a lado numa tela estreita. */}
        <Tabs.ListContainer>
          <Tabs.List aria-label="Partes do avatar">
            {avatarTabs.map(({ id, label }) => (
              <Tabs.Tab key={id} id={id}>
                {label}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="accessories" className="pt-2">
          <AvatarOptionGrid<AccessoriesVariant>
            group="accessories"
            legend="Acessórios"
            value={config.accessories}
            onChange={(accessories) => patch({ accessories })}
            noneLabel="Sem acessório"
          />
        </Tabs.Panel>

        <Tabs.Panel id="eyes" className="pt-2">
          <AvatarOptionGrid<EyesVariant>
            group="eyes"
            legend="Olhos"
            value={config.eyes}
            onChange={(eyes) => patch({ eyes })}
          />
        </Tabs.Panel>

        <Tabs.Panel id="hair" className="pt-2">
          <AvatarOptionGrid<HairVariant>
            group="hair"
            legend="Cabelo"
            value={config.hair}
            onChange={(hair) => patch({ hair })}
          />
        </Tabs.Panel>

        <Tabs.Panel id="mouth" className="pt-2">
          <AvatarOptionGrid<MouthVariant>
            group="mouth"
            legend="Boca"
            value={config.mouth}
            onChange={(mouth) => patch({ mouth })}
          />
        </Tabs.Panel>

        <Tabs.Panel id="colors" className="flex flex-col gap-5 pt-2">
          <AvatarColorRow
            name="avatar-hair-color"
            label="Cor do cabelo"
            colors={defaultHairColors}
            value={config.hairColor}
            onChange={(hairColor) => patch({ hairColor })}
          />

          <AvatarColorRow
            name="avatar-skin-color"
            label="Tom de pele"
            colors={defaultSkinColors}
            value={config.skinColor}
            onChange={(skinColor) => patch({ skinColor })}
          />

          <AvatarColorRow
            name="avatar-background-color"
            label="Cor de fundo"
            colors={defaultBackgroundColors}
            value={config.backgroundColor}
            onChange={(backgroundColor) => patch({ backgroundColor })}
          />
        </Tabs.Panel>
      </Tabs>

      {saveError !== null ? (
        <p role="alert" className="text-danger text-sm text-pretty">
          {saveError}
        </p>
      ) : null}

      {/* `/perfil/avatar` é rota de detalhe e não exibe a barra inferior, então
          a barra de ação fica desobstruída no rodapé. */}
      <div className="sticky bottom-0 -mx-6 -mb-6 border-t bg-white/85 px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] backdrop-blur">
        <Button
          variant="primary"
          size="lg"
          className="w-full sm:w-fit"
          isDisabled={url === savedUrl}
          isPending={isSaving}
          onPress={() => void handleSave()}
        >
          Salvar avatar
        </Button>
      </div>
    </main>
  );
}
