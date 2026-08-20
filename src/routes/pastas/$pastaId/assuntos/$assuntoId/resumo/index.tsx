import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/pastas/$pastaId/assuntos/$assuntoId/resumo/",
)({
  component: SummaryPage,
});

function SummaryPage() {
  return <div>Hello "/pastas/$pastaId/assuntos/$assuntoId/resumo/"!</div>;
}
