import { Camera } from "@/components/Camera";
import { addSubjectMaterial, getSubject } from "@/mocks/subjects";
import type { Material } from "@/types/Material";
import { useNavigate, useParams } from "react-router";

export default function SubjectCameraPage() {
  const navigate = useNavigate();
  const { pastaId, assuntoId } = useParams<"pastaId" | "assuntoId">() as {
    pastaId: string;
    assuntoId: string;
  };
  const subject = getSubject(pastaId, assuntoId);

  function handleSelectMaterial(material: Material) {
    addSubjectMaterial(pastaId, assuntoId, material);
    navigate(-1);
  }

  return (
    <Camera
      title={subject?.name ?? "Assunto"}
      onSelectMaterial={handleSelectMaterial}
    />
  );
}
