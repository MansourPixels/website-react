import { Button } from "@heroui/react";
import { ChevronLeft, Search } from "lucide-react";

interface NavMenuProps {
  title: string;
  hasBackButton?: boolean;
  hasSearch?: boolean;
}

export function NavMenu({
  title,
  hasBackButton = false,
  hasSearch = false,
}: NavMenuProps) {
  return (
    <header className="flex items-center justify-between">
      {hasBackButton ? (
        <Button isIconOnly variant="tertiary">
          <ChevronLeft />
        </Button>
      ) : null}
      <h1 className="text-3xl font-semibold">{title}</h1>
      {hasSearch ? (
        <Button isIconOnly variant="tertiary">
          <Search />
        </Button>
      ) : null}
    </header>
  );
}
