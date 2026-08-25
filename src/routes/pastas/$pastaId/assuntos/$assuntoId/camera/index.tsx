import { Camera } from "@/components/Camera";
import { addSubjectMaterial, getSubject } from "@/mocks/subjects";
import type { Material } from "@/types/Material";
import { createFileRoute, useRouter } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/pastas/$pastaId/assuntos/$assuntoId/camera/",
)({
  component: SubjectCameraPage,
});

function SubjectCameraPage() {
  const router = useRouter();
  const { pastaId, assuntoId } = Route.useParams();
  const subject = getSubject(pastaId, assuntoId);

  function handleSelectMaterial(material: Material) {
    addSubjectMaterial(pastaId, assuntoId, material);
    router.history.back();
  }

  return (
    <Camera
      title={subject?.name ?? "Assunto"}
      onSelectMaterial={handleSelectMaterial}
    />
  );
}
