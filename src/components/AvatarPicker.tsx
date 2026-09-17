import { Tabs } from "@heroui/react";

import { AvatarColorRow } from "@/components/AvatarColorRow";
import { AvatarOptionGrid } from "@/components/AvatarOptionGrid";
import {
  defaultBackgroundColors,
  defaultHairColors,
  defaultSkinColors,
  type AccessoriesVariant,
  type AvatarConfig,
  type EyesVariant,
  type HairVariant,
  type MouthVariant,
} from "@/utils/avatar";

const avatarTabs = [
  { id: "accessories", label: "Acessórios" },
  { id: "eyes", label: "Olhos" },
  { id: "hair", label: "Cabelo" },
  { id: "mouth", label: "Boca" },
  { id: "colors", label: "Cores" },
];

interface AvatarPickerProps {
  config: AvatarConfig;
  /** Recebe só o que mudou; quem chama decide como mesclar. */
  onChange: (changes: Partial<AvatarConfig>) => void;
  className?: string;
}

/**
 * As cinco abas de peças do avatar, sem prévia e sem salvar — essas duas partes
 * mudam entre as telas que usam isto (o Perfil volta para `/perfil`, o
 * onboarding avança de etapa), então ficam com quem chama.
 */
export function AvatarPicker({
  config,
  onChange,
  className = "rounded-3xl bg-surface p-4 shadow-surface",
}: AvatarPickerProps) {
  return (
    <Tabs defaultSelectedKey="accessories" className={className}>
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

      <Tabs.Panel id="accessories" className="pt-4">
        <AvatarOptionGrid<AccessoriesVariant>
          group="accessories"
          legend="Acessórios"
          value={config.accessories}
          onChange={(accessories) => onChange({ accessories })}
          noneLabel="Sem acessório"
        />
      </Tabs.Panel>

      <Tabs.Panel id="eyes" className="pt-4">
        <AvatarOptionGrid<EyesVariant>
          group="eyes"
          legend="Olhos"
          value={config.eyes}
          onChange={(eyes) => onChange({ eyes })}
        />
      </Tabs.Panel>

      <Tabs.Panel id="hair" className="pt-4">
        <AvatarOptionGrid<HairVariant>
          group="hair"
          legend="Cabelo"
          value={config.hair}
          onChange={(hair) => onChange({ hair })}
        />
      </Tabs.Panel>

      <Tabs.Panel id="mouth" className="pt-4">
        <AvatarOptionGrid<MouthVariant>
          group="mouth"
          legend="Boca"
          value={config.mouth}
          onChange={(mouth) => onChange({ mouth })}
        />
      </Tabs.Panel>

      <Tabs.Panel id="colors" className="flex flex-col gap-5 pt-4">
        <AvatarColorRow
          name="avatar-hair-color"
          label="Cor do cabelo"
          colors={defaultHairColors}
          value={config.hairColor}
          onChange={(hairColor) => onChange({ hairColor })}
        />

        <AvatarColorRow
          name="avatar-skin-color"
          label="Tom de pele"
          colors={defaultSkinColors}
          value={config.skinColor}
          onChange={(skinColor) => onChange({ skinColor })}
        />

        <AvatarColorRow
          name="avatar-background-color"
          label="Cor de fundo"
          colors={defaultBackgroundColors}
          value={config.backgroundColor}
          onChange={(backgroundColor) => onChange({ backgroundColor })}
        />
      </Tabs.Panel>
    </Tabs>
  );
}
