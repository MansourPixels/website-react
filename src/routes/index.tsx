import { Camera } from "@/components/Camera";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: CameraPage,
});

function CameraPage() {
  return <Camera footerClass="bottom-[var(--nav-inset)]" />;
}
