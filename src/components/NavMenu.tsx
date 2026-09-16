import { useCanGoBack } from "@/hooks/useCanGoBack";
import { Button, cn, SearchField } from "@heroui/react";
import { ChevronLeft, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

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

  function closeSearch() {
    onSearch("");
    setIsSearchVisible(false);
  }

  function toggleSearch() {
    if (isSearchVisible) {
      closeSearch();
      return;
    }

    setIsSearchVisible(true);
  }

  return (
    <header
      className={cn("flex items-center justify-between gap-2", className)}
    >
      <div
        className={cn(
          "flex flex-1 items-center min-w-0",
          hasSearch && "max-w-[75vw]",
        )}
        onKeyDown={(event) => {
          if (event.key === "Escape" && isSearchVisible) closeSearch();
        }}
      >
        {hasBackButton && (canGoBack || backHref !== undefined) ? (
          <Button
            isIconOnly
            variant="ghost"
            aria-label="Voltar"
            onPress={() => {
              // O destino declarado pela rota vence o histórico: sem este
              // `return` os dois navigate disparavam na mesma ação.
              if (backHref !== undefined) {
                navigate(backHref, { replace: true });
                return;
              }

              navigate(-1);
            }}
            size="lg"
            className={variant === "white" ? "not-active:text-white" : ""}
          >
            <ChevronLeft className="size-6 transition-all" />
          </Button>
        ) : null}

        {isSearchVisible ? (
          <>
            {/* A busca toma o lugar do título, mas a tela não pode ficar sem
                nome acessível enquanto ela está aberta. */}
            <h1 className="sr-only">{title}</h1>
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
          </>
        ) : (
          <h1
            className={cn(
              "text-3xl font-semibold line-clamp-1 break-all flex-1",
              variant === "white" && "text-white",
            )}
          >
            {title}
          </h1>
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
