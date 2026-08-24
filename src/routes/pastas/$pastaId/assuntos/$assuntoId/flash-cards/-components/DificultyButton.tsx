import { buttonVariants } from "@heroui/react";

interface DifficultyButtonProps {
  image: string;
  label: string;
  onClick: () => void;
}

export function DifficultyButton({
  image,
  label,
  onClick,
}: DifficultyButtonProps) {
  return (
    <button
      className={buttonVariants({
        className: "flex flex-col items-center gap-2 h-auto p-2 group",
        variant: "ghost",
      })}
      onClick={onClick}
    >
      {/* No dedo não existe hover: sem o par `group-active`, o único gesto
          desta tela (que é exclusiva de celular) não devolve nada. */}
      <div className="size-16 rounded-full bg-white shadow-surface flex items-center justify-center group-hover:border-emerald-500 group-active:border-emerald-500 border-2 border-transparent transition-all">
        <img
          src={image}
          alt=""
          className="group-hover:scale-110 group-active:scale-110 transition-all duration-300"
        />
      </div>
      <span className="font-medium">{label}</span>
    </button>
  );
}
