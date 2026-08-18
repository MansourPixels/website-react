import { Button } from "@heroui/react";
import { Plus } from "lucide-react";

export function FABButton() {
  return (
    <Button
      isIconOnly
      size="lg"
      className="fixed bottom-20 right-4 size-14 rounded-full"
    >
      <Plus className="size-6" />
    </Button>
  );
}
