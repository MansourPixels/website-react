import { Button, cn, type ButtonRootProps } from "@heroui/react";
import { Plus, type LucideIcon } from "lucide-react";

type FABButtonProps = Omit<ButtonRootProps, "children"> & {
  icon?: LucideIcon;
};

export function FABButton({
  icon: Icon = Plus,
  className,
  ...props
}: FABButtonProps) {
  return (
    <Button
      isIconOnly
      size="lg"
      aria-label="Adicionar"
      className={cn("fixed bottom-4 right-4 size-14 rounded-full", className)}
      {...props}
    >
      <Icon className="size-6" />
    </Button>
  );
}
