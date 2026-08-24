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
        // Ancorado na área segura embaixo e, na horizontal, na borda do
        // contêiner de conteúdo (max-w-6xl = 72rem) em vez da borda da janela.
        // Num monitor largo, um FAB colado no canto do 4K fica órfão do
        // conteúdo que ele age sobre.
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
