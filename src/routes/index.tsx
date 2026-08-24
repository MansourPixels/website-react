import { Camera } from "@/components/Camera";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: CameraPage,
});

function CameraPage() {
  // Os controles precisam parar acima da navegação inferior, que muda de altura
  // entre celular e desktop e ainda soma a área segura do aparelho.
  return <Camera footerClass="bottom-[var(--nav-inset)]" />;
}
