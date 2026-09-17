import { Camera } from "@/components/Camera";
import { pageMeta } from "@/utils/pageMeta";

export function meta() {
  return pageMeta({
    title: "Capturar material",
    description:
      "Fotografe o caderno, a lousa ou a apostila e deixe o Revi reconhecer a disciplina e arquivar o material.",
  });
}

export default function CameraPage() {
  return <Camera footerClass="bottom-[var(--nav-inset)]" />;
}
