import {
  ColorArea,
  ColorPickerPopover,
  ColorPickerRoot,
  ColorPickerTrigger,
  ColorSlider,
  Label,
  cn,
  parseColor,
} from "@heroui/react";
import { Check, Pipette } from "lucide-react";

/** Fundo do botão de cor personalizada enquanto nenhuma foi escolhida. */
const COLOR_WHEEL =
  "conic-gradient(#ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)";

interface AvatarColorRowProps {
  name: string;
  label: string;
  colors: string[];
  /** Hex de seis dígitos sem `#`, como o DiceBear espera. */
  value: string;
  onChange: (color: string) => void;
}

export function AvatarColorRow({
  name,
  label,
  colors,
  value,
  onChange,
}: AvatarColorRowProps) {
  // Fora da paleta, a cor só pode ter vindo do seletor livre — e é o botão dele
  // que passa a carregar o estado de selecionado.
  const isCustom = !colors.includes(value);

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">{label}</legend>

      <div className="flex flex-wrap gap-2">
        {colors.map((color) => {
          const isSelected = color === value;

          return (
            <label
              key={color}
              className={cn(
                "flex size-10 cursor-pointer items-center justify-center rounded-full border-2 transition-colors pointer-coarse:size-11",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
                isSelected ? "border-accent" : "border-transparent",
              )}
            >
              <input
                type="radio"
                name={name}
                checked={isSelected}
                onChange={() => onChange(color)}
                className="sr-only"
              />
              <span className="sr-only">{`${label}: #${color}`}</span>
              <span
                // O anel interno delimita as cores claras sem recorrer a
                // sombra em controle, que o sistema não usa e que some no
                // tema escuro.
                className="flex size-8 items-center justify-center rounded-full ring-1 ring-black/10 ring-inset"
                style={{ backgroundColor: `#${color}` }}
              >
                {isSelected ? (
                  // `mix-blend-difference` mantém o contraste do visto tanto
                  // sobre um marrom escuro quanto sobre um amarelo claro.
                  <Check
                    className="size-4 text-white mix-blend-difference"
                    aria-hidden="true"
                  />
                ) : null}
              </span>
            </label>
          );
        })}

        <ColorPickerRoot
          value={parseColor(`#${value}`)}
          onChange={(color) =>
            onChange(color.toString("hex").slice(1).toLowerCase())
          }
        >
          <ColorPickerTrigger
            aria-label={
              isCustom
                ? `${label}: cor personalizada #${value}. Escolher outra.`
                : `${label}: escolher uma cor personalizada`
            }
            className={cn(
              "flex size-10 items-center justify-center rounded-full border-2 p-0 transition-colors pointer-coarse:size-11",
              isCustom ? "border-accent" : "border-transparent",
            )}
          >
            <span
              className="grid size-8 place-items-center rounded-full ring-1 ring-black/10 ring-inset"
              style={
                isCustom
                  ? { backgroundColor: `#${value}` }
                  : { backgroundImage: COLOR_WHEEL }
              }
            >
              {/* O disco branco garante que o ícone seja legível tanto sobre o
                  arco-íris quanto sobre qualquer cor que o aluno escolher —
                  por isso o ícone fixa a cor em vez de herdar `--foreground`,
                  que no tema escuro seria branco sobre branco. */}
              <span className="grid size-5 place-items-center rounded-full bg-white">
                <Pipette className="size-3 text-zinc-900" aria-hidden="true" />
              </span>
            </span>
          </ColorPickerTrigger>

          <ColorPickerPopover>
            <ColorArea
              aria-label={`${label}: saturação e brilho`}
              className="max-w-full"
              colorSpace="hsb"
              xChannel="saturation"
              yChannel="brightness"
            >
              <ColorArea.Thumb />
            </ColorArea>
            <ColorSlider
              aria-label={`${label}: matiz`}
              channel="hue"
              className="gap-1 px-1"
              colorSpace="hsb"
            >
              <Label>Matiz</Label>
              <ColorSlider.Output className="text-muted" />
              <ColorSlider.Track>
                <ColorSlider.Thumb />
              </ColorSlider.Track>
            </ColorSlider>
          </ColorPickerPopover>
        </ColorPickerRoot>
      </div>
    </fieldset>
  );
}
