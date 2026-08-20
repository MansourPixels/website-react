import { Button, type ButtonRootProps } from "@heroui/react";
import { Plus, type LucideIcon } from "lucide-react";

type FABButtonProps = Omit<ButtonRootProps, "children"> & {
  icon: LucideIcon;
};

export function FABButton({ icon: Icon = Plus, ...props }: FABButtonProps) {
  return (
    <Button
      isIconOnly
      size="lg"
      aria-label="Adicionar"
      className="fixed bottom-20 right-4 size-14 rounded-full"
      {...props}
    >
      <Icon className="size-6" />
    </Button>
  );
}
