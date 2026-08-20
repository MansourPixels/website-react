import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/pastas/$pastaId/assuntos/$assuntoId/")({
  component: SubjectDetailsPage,
});

function SubjectDetailsPage() {
  return <div>Hello "/pastas/$pastaId/assuntos/$assuntoId/"!</div>;
}
