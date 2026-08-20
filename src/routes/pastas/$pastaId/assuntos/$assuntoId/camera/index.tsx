import { Camera } from "@/components/Camera";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/pastas/$pastaId/assuntos/$assuntoId/camera/",
)({
  component: SubjectCameraPage,
});

function SubjectCameraPage() {
  return <Camera title="Equação de terceiro grau" />;
}
