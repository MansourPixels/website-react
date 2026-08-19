import { Button, SearchField } from "@heroui/react";
import { ChevronLeft, Search } from "lucide-react";
import { useState } from "react";

interface NavMenuProps {
  title: string;
  hasBackButton?: boolean;
  hasSearch?: boolean;
  onSearch?: (term: string) => void;
}

export function NavMenu({
  title,
  hasBackButton = false,
  hasSearch = false,
  onSearch = () => {},
}: NavMenuProps) {
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  function toggleSearch() {
    if (isSearchVisible) onSearch("");
    setIsSearchVisible(!isSearchVisible);
  }

  return (
    <header className="flex items-center justify-between gap-2">
      {hasBackButton ? (
        <Button isIconOnly variant="tertiary">
          <ChevronLeft />
        </Button>
      ) : null}
      <div className="relative flex-1">
        {isSearchVisible ? (
          <SearchField
            name="search"
            className="w-full"
            aria-label={`Pesquisar em ${title}`}
            onChange={onSearch}
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input
                autoFocus
                placeholder="Insira um termo para pesquisar..."
              />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        ) : (
          <h1 className="text-3xl font-semibold">{title}</h1>
        )}
      </div>
      {hasSearch ? (
        <Button
          isIconOnly
          variant="tertiary"
          aria-label={isSearchVisible ? "Fechar pesquisa" : "Pesquisar"}
          onPress={toggleSearch}
        >
          <Search />
        </Button>
      ) : null}
    </header>
  );
}
