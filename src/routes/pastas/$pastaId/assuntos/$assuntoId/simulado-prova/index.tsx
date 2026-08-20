import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/pastas/$pastaId/assuntos/$assuntoId/simulado-prova/",
)({
  component: PracticeTestPage,
});

function PracticeTestPage() {
  return (
    <div>Hello "/pastas/$pastaId/assuntos/$assuntoId/simulado-prova/"!</div>
  );
}
