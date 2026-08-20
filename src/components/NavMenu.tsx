import { Button, SearchField } from "@heroui/react";
import { useCanGoBack, useRouter } from "@tanstack/react-router";
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
  const router = useRouter();
  const canGoBack = useCanGoBack();

  const [isSearchVisible, setIsSearchVisible] = useState(false);

  function toggleSearch() {
    if (isSearchVisible) onSearch("");
    setIsSearchVisible(!isSearchVisible);
  }

  return (
    <header className="flex items-center justify-between gap-2">
      <div className="flex-1 max-w-[75vw]">
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
          <div className="flex items-center">
            {hasBackButton && canGoBack ? (
              <Button
                isIconOnly
                variant="ghost"
                onClick={() => router.history.back()}
                size="lg"
              >
                <ChevronLeft className="size-6" />
              </Button>
            ) : null}
            <h1 className="text-3xl font-semibold line-clamp-1 break-all">{title}</h1>
          </div>
        )}
      </div>
      {hasSearch ? (
        <Button
          isIconOnly
          variant="tertiary"
          aria-label={isSearchVisible ? "Fechar pesquisa" : "Pesquisar"}
          onPress={toggleSearch}
          size="lg"
        >
          <Search />
        </Button>
      ) : null}
    </header>
  );
}
