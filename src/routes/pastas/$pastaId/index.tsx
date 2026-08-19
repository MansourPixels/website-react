import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/pastas/$pastaId/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { pastaId } = Route.useParams();

  return <div>Pasta ID: {pastaId}</div>;
}
