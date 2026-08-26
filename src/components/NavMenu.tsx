import { Button, cn, SearchField } from "@heroui/react";
import { ChevronLeft, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useCanGoBack } from "@/hooks/useCanGoBack";

interface NavMenuProps {
  title: string;
  hasBackButton?: boolean;
  backHref?: string;
  hasSearch?: boolean;
  onSearch?: (term: string) => void;
  variant?: "black" | "white";
  className?: string;
}

export function NavMenu({
  title,
  hasBackButton = false,
  backHref = undefined,
  hasSearch = false,
  onSearch = () => {},
  variant = "black",
  className,
}: NavMenuProps) {
  const navigate = useNavigate();
  const canGoBack = useCanGoBack();

  const [isSearchVisible, setIsSearchVisible] = useState(false);

  function toggleSearch() {
    if (isSearchVisible) onSearch("");
    setIsSearchVisible(!isSearchVisible);
  }

  return (
    <header
      className={cn("flex items-center justify-between gap-2", className)}
    >
      <div className={cn("flex-1", hasSearch && "max-w-[75vw]")}>
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
                onClick={() => {
                  if (backHref) {
                    navigate(backHref);
                  } else {
                    navigate(-1);
                  }
                }}
                size="lg"
                className={variant === "white" ? "not-active:text-white" : ""}
              >
                <ChevronLeft className="size-6 transition-all" />
              </Button>
            ) : null}
            <h1
              className={cn(
                "text-3xl font-semibold line-clamp-1 break-all flex-1",
                variant === "white" && "text-white",
              )}
            >
              {title}
            </h1>
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
