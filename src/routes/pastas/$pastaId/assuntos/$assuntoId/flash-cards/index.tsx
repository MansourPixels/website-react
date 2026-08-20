import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/pastas/$pastaId/assuntos/$assuntoId/flash-cards/",
)({
  component: FlashCardsPage,
});

function FlashCardsPage() {
  return <div>Hello "/pastas/$pastaId/assuntos/$assuntoId/flash-cards/"!</div>;
}
