import { useState } from "react";
import { useNavigate, useParams } from "react-router";

import { FABButton } from "@/components/FABButton";
import { MaterialViewer } from "@/components/MaterialViewer";
import { NavMenu } from "@/components/NavMenu";
import { getSubject } from "@/mocks/subjects";
import type { Material } from "@/types/Material";
import { normalizeText } from "@/utils/text";
import { Camera, FileText, ListCheck, Network, Zap } from "lucide-react";
import { MaterialTile } from "./components/MaterialTile";
import { StudyTypeCard } from "./components/StudyTypeCard";

export default function SubjectDetailsPage() {
  const { pastaId, assuntoId } = useParams<"pastaId" | "assuntoId">() as {
    pastaId: string;
    assuntoId: string;
  };
  const subject = getSubject(pastaId, assuntoId);

  const [search, setSearch] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null,
  );

  const normalizedSearch = normalizeText(search);
  const materials = subject?.materials ?? [];
  const filteredMaterials = normalizedSearch
    ? materials.filter((material) =>
        normalizeText(material.name).includes(normalizedSearch),
      )
    : materials;

  const navigate = useNavigate();

  return (
    <main className="p-6 md:p-8 gap-8 flex flex-col w-full max-w-6xl mx-auto">
      <NavMenu
        title={subject?.name ?? "Assunto"}
        hasBackButton
        hasSearch
        onSearch={setSearch}
      />
      <section
        id="tipos-estudo"
        className="grid md:grid-cols-2 gap-3"
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
        <StudyTypeCard
          id="mapa-mental"
          name="Mapa mental"
          description="Os conceitos do assunto ligados em ramos, revelados um a um conforme você avança."
          icon={Network}
          iconClass="bg-cyan-600"
        />
      </section>
      {filteredMaterials.length > 0 ? (
        <section
          id="materiais"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 h-full"
        >
          {filteredMaterials.map((material) => (
            <MaterialTile
              key={material.id}
              material={material}
              onOpen={() => setSelectedMaterial(material)}
            />
          ))}
        </section>
      ) : (
        <p className="text-muted text-center py-8">
          {normalizedSearch
            ? `Nenhum material encontrado para "${search.trim()}".`
            : "Este assunto ainda não tem materiais. Adicione o primeiro pela câmera."}
        </p>
      )}
      <FABButton icon={Camera} onClick={() => navigate("camera")} />
      <MaterialViewer
        material={selectedMaterial}
        onClose={() => setSelectedMaterial(null)}
      />
    </main>
  );
}
