import { parseColor } from "@heroui/react";

export function getRandomColor() {
  const randomHue = Math.floor(Math.random() * 360);
  const randomSaturation = 50 + Math.floor(Math.random() * 50); // 50-100%
  const randomLightness = 40 + Math.floor(Math.random() * 30); // 40-70%

  return parseColor(
    `hsl(${randomHue}, ${randomSaturation}%, ${randomLightness}%)`,
  ).toString("hex");
}
