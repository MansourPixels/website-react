import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";

import { FABButton } from "@/components/FABButton";
import { NavMenu } from "@/components/NavMenu";
import { Button } from "@heroui/react";
import { Camera, FileText, ListCheck, Zap } from "lucide-react";
import { StudyTypeCard } from "./StudyTypeCard";

export const Route = createFileRoute("/pastas/$pastaId/assuntos/$assuntoId/")({
  component: SubjectDetailsPage,
});

function SubjectDetailsPage() {
  const [search, setSearch] = useState("");
  const params = useParams({ from: "/pastas/$pastaId/assuntos/$assuntoId/" });

  return (
    <main className="p-6 gap-8 flex flex-col">
      <NavMenu
        title="Equação de terceiro grau"
        hasBackButton
        hasSearch
        onSearch={setSearch}
      />
      <section id="tipos-estudo" className="flex flex-col gap-3">
        <StudyTypeCard
          id="flash-cards"
          name="Flash Cards"
          description="Cartões de memorização que utilizam aprendizagem ativa e a repetição espaçada."
          icon={Zap}
          iconClass="bg-cyan-700"
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
      <section id="imagens" className="grid grid-cols-2 gap-3 h-full">
        {Array.from({ length: 8 }, (_, index) => (
          <Button
            className="aspect-square h-auto p-0 rounded-xl overflow-hidden"
            fullWidth
          >
            <img
              src={`https://picsum.photos/300/300?random=${index}`}
              alt=""
              className="size-full"
            />
          </Button>
        ))}
      </section>
      <FABButton icon={Camera} />
    </main>
  );
}
