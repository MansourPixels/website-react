import {
  ColorArea,
  ColorSlider,
  ColorSwatch,
  ColorSwatchPicker,
  ColorPickerPopover,
  ColorPickerRoot,
  ColorPickerTrigger,
  Label,
  type ColorPickerRootProps,
} from "@heroui/react";

interface ColorPickerProps
  extends Omit<ColorPickerRootProps, "children" | "value" | "onChange"> {
  label: string;
  value?: string;
  onChange?: (color: string) => void;
}

export function ColorPicker({ label, onChange, ...props }: ColorPickerProps) {
  const presets = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#06b6d4",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#f43f5e",
  ];

  return (
    <ColorPickerRoot
      {...props}
      onChange={(color) => onChange?.(color.toString("hex"))}
    >
      <ColorPickerTrigger className="grid w-full text-start gap-1">
        <Label>{label}</Label>
        <ColorSwatch size="lg" className="w-full rounded-xl shadow" />
      </ColorPickerTrigger>
      <ColorPickerPopover>
        <ColorArea
          aria-label="Color area"
          className="max-w-full"
          colorSpace="hsb"
          xChannel="saturation"
          yChannel="brightness"
        >
          <ColorArea.Thumb />
        </ColorArea>
        <ColorSlider
          aria-label="Hue slider"
          channel="hue"
          className="gap-1 px-1"
          colorSpace="hsb"
        >
          <Label>Hue</Label>
          <ColorSlider.Output className="text-muted" />
          <ColorSlider.Track>
            <ColorSlider.Thumb />
          </ColorSlider.Track>
        </ColorSlider>
        <ColorSwatchPicker className="justify-center px-1" size="xs">
          {presets.map((preset) => (
            <ColorSwatchPicker.Item key={preset} color={preset}>
              <ColorSwatchPicker.Swatch />
            </ColorSwatchPicker.Item>
          ))}
        </ColorSwatchPicker>
      </ColorPickerPopover>
    </ColorPickerRoot>
  );
}
