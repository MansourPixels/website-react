import { Camera } from "@/components/Camera";
import { createFileRoute, useRouter } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/pastas/$pastaId/assuntos/$assuntoId/camera/",
)({
  component: SubjectCameraPage,
});

function SubjectCameraPage() {
  const router = useRouter();

  return (
    <Camera
      title="Equação de terceiro grau"
      onSelectMaterial={() => router.history.back()}
    />
  );
}
