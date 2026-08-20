import { Button } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { CircleStar } from "lucide-react";
import { NavMenu } from "@/components/NavMenu";

export const Route = createFileRoute("/trilha/")({
  component: PathPage,
});

function PathPage() {
  return (
    <div className="p-6 gap-8 flex flex-col">
      <NavMenu title="Trilha" hasSearch />
      <div>
        <p>
          Foi identificado uma queda de domínio nos assuntos relacionados a{" "}
          <strong>português</strong>, <strong>matemática</strong> e{" "}
          <strong>geografia</strong>. Vamos focar para melhorar isso? 😎
        </p>
        <h2>Português</h2>
        <p>
          Percebemos que a <strong>produção textual de redações</strong> precisa
          de um pouco mais de atenção. Com treino e dedicação, você pode evoluir
          bastante nessa habilidade!
        </p>
        <Button variant="primary" fullWidth>
          <CircleStar />
          Seguir plano de estudos
        </Button>
      </div>
    </div>
  );
}
