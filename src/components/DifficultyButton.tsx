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
      <div className="size-16 rounded-full bg-surface flex items-center justify-center group-hover:border-emerald-500 group-active:border-emerald-500 border-2 border-transparent transition-colors motion-reduce:transition-none">
        <img
          src={image}
          alt=""
          width={42}
          height={42}
          className="transition-transform duration-300 group-hover:scale-110 group-active:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-active:scale-100"
        />
      </div>
      <span className="font-medium">{label}</span>
    </button>
  );
}
