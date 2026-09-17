import { useNavigate, useParams } from "react-router";

import { uploadContent } from "@/api/content";
import { Camera } from "@/components/Camera";
import type { CapturedFile } from "@/types/capture";
import { ensureUploadFilename } from "@/utils/materials";
import { pageMeta } from "@/utils/pageMeta";

export function meta() {
  return pageMeta({
    title: "Adicionar material",
    description:
      "Fotografe ou envie um arquivo para somar ao material deste assunto.",
  });
}

export default function SubjectCameraPage() {
  const navigate = useNavigate();
  const { assuntoId } = useParams<"pastaId" | "assuntoId">() as {
    pastaId: string;
    assuntoId: string;
  };

  async function handleSelectMaterial(file: CapturedFile) {
    const uploadFile = ensureUploadFilename(file.blob, file.contentType);

    await uploadContent(assuntoId, uploadFile, file.contentType);
    navigate(-1);
  }

  return (
    <Camera
      title="Adicionar material"
      onSelectMaterial={handleSelectMaterial}
      // O destino já é este assunto: o material do Drive entra direto, sem
      // repetir uma pergunta que a própria rota já respondeu.
      driveChildFolderId={assuntoId}
      onDriveImported={() => navigate(-1)}
    />
  );
}
