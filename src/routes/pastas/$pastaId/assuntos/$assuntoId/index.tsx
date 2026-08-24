import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { FABButton } from "@/components/FABButton";
import { ImageViewer } from "@/components/ImageViewer";
import { NavMenu } from "@/components/NavMenu";
import { Button } from "@heroui/react";
import { Camera, FileText, ListCheck, Zap } from "lucide-react";
import { StudyTypeCard } from "./-components/StudyTypeCard";

const images = Array.from(
  { length: 8 },
  (_, index) => `https://picsum.photos/300/300?random=${index}`,
);

export const Route = createFileRoute("/pastas/$pastaId/assuntos/$assuntoId/")({
  component: SubjectDetailsPage,
});

function SubjectDetailsPage() {
  // @ts-ignore
  const [search, setSearch] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const navigate = useNavigate({
    from: "/pastas/$pastaId/assuntos/$assuntoId/",
  });

  return (
    <main className="p-6 md:p-8 gap-8 flex flex-col w-full max-w-6xl mx-auto">
      <NavMenu
        title="Equação de terceiro grau"
        hasBackButton
        hasSearch
        onSearch={setSearch}
      />
      <section
        id="tipos-estudo"
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-3"
      >
        <StudyTypeCard
          id="flash-cards"
          name="Flash Cards"
          description="Cartões de memorização que utilizam aprendizagem ativa e a repetição espaçada."
          icon={Zap}
          iconClass="bg-emerald-500"
        />
        <StudyTypeCard
          id="resumo"
          name="Resumo"
          description="Texto conciso para sintetizar as ideias principais do assunto proposto."
          icon={FileText}
          iconClass="bg-purple-700"
        />
        <StudyTypeCard
          id="simulado-prova"
          name="Simulado de prova"
          description="Reprodução simulada no formato de uma prova com o objetivo de preparar o aluno."
          icon={ListCheck}
          iconClass="bg-orange-600"
        />
      </section>
      <section
        id="imagens"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 h-full"
      >
        {images.map((image, index) => (
          <Button
            key={image}
            className="aspect-square h-auto p-0 rounded-xl overflow-hidden"
            fullWidth
            aria-label={`Abrir imagem ${index + 1}`}
            onPress={() => setSelectedImage(image)}
          >
            <img src={image} alt="" className="size-full object-cover" />
          </Button>
        ))}
      </section>
      <FABButton icon={Camera} onClick={() => navigate({ to: "camera" })} />
      <ImageViewer
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </main>
  );
}
