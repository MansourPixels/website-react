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
      className={cn(
        "fixed size-14 rounded-full",
        "bottom-[max(1rem,env(safe-area-inset-bottom))]",
        "right-[max(1rem,calc(50vw_-_36rem_+_1rem))]",
        className,
      )}
      {...props}
    >
      <Icon className="size-6" />
    </Button>
  );
}
