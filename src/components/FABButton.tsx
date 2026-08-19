import { Button, type ButtonRootProps } from "@heroui/react";
import { Plus } from "lucide-react";

type FABButtonProps = Omit<ButtonRootProps, "children">;

export function FABButton(props: FABButtonProps) {
  return (
    <Button
      isIconOnly
      size="lg"
      aria-label="Adicionar"
      className="fixed bottom-20 right-4 size-14 rounded-full"
      {...props}
    >
      <Plus className="size-6" />
    </Button>
  );
}
