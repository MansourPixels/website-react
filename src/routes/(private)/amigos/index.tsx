import { SearchField, Spinner, Tabs } from "@heroui/react";
import { useEffect, useState } from "react";

import { ApiError } from "@/api/client";
import {
  listFriendRequests,
  listFriends,
  searchUsers,
} from "@/api/friends";
import { NavMenu } from "@/components/NavMenu";
import type {
  Friend,
  FriendRequest,
  UserSearchResult,
} from "@/types/api/friend";

import { FriendRequestRow } from "./components/FriendRequestRow";
import { FriendRow } from "./components/FriendRow";
import { UserSearchResults } from "./components/UserSearchResults";

/** Espera o usuário parar de digitar antes de buscar. */
const SEARCH_DEBOUNCE_MS = 400;
const MIN_SEARCH_LENGTH = 2;

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [requests, setRequests] = useState<FriendRequest[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [term, setTerm] = useState("");
  const [results, setResults] = useState<UserSearchResult[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([listFriends(), listFriendRequests()])
      .then(([friendList, requestList]) => {
        if (cancelled) return;

        setFriends(friendList);
        setRequests(requestList);
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        setLoadError(
          error instanceof ApiError
            ? error.detail
            : "Não foi possível carregar seus amigos. Tente novamente.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const trimmed = term.trim();

    if (trimmed.length < MIN_SEARCH_LENGTH) {
      setResults(null);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    let cancelled = false;

    setIsSearching(true);
    setSearchError(null);

    const timer = setTimeout(() => {
      searchUsers(trimmed)
        .then((found) => {
          if (!cancelled) setResults(found);
        })
        .catch((error: unknown) => {
          if (cancelled) return;

          setSearchError(
            error instanceof ApiError
              ? error.detail
              : "Não foi possível buscar agora. Tente novamente.",
          );
        })
        .finally(() => {
          if (!cancelled) setIsSearching(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term]);

  // Recebe a solicitação que o serviço devolveu — com o id real, para o botão
  // "Cancelar" da aba de solicitações funcionar sem recarregar a página.
  function handleRequestSent(request: FriendRequest) {
    setRequests((current) => [request, ...(current ?? [])]);
  }

  function handleAccepted(request: FriendRequest, friend: Friend) {
    setRequests((current) =>
      (current ?? []).filter((item) => item.id !== request.id),
    );
    setFriends((current) =>
      [...(current ?? []), friend].sort((a, b) => b.xp - a.xp),
    );
    // A busca guarda o status antigo do usuário aceito; deixá-la de fora
    // mostraria "Adicionar" para quem já virou amigo.
    setResults((current) =>
      current === null
        ? null
        : current.map((item) =>
            item.id === friend.id ? { ...item, friendship: "friends" } : item,
          ),
    );
  }

  function handleResolved(request: FriendRequest) {
    setRequests((current) =>
      (current ?? []).filter((item) => item.id !== request.id),
    );
    setResults((current) =>
      current === null
        ? null
        : current.map((item) =>
            item.id === request.user.id
              ? { ...item, friendship: "none" }
              : item,
          ),
    );
  }

  function handleRemoved(friend: Friend) {
    setFriends((current) =>
      (current ?? []).filter((item) => item.id !== friend.id),
    );
    setResults((current) =>
      current === null
        ? null
        : current.map((item) =>
            item.id === friend.id ? { ...item, friendship: "none" } : item,
          ),
    );
  }

  const receivedCount = (requests ?? []).filter(
    (request) => request.direction === "received",
  ).length;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 md:p-8">
      <NavMenu title="Amigos" hasBackButton backHref="/turmas" />

      <section className="bg-surface shadow-surface flex flex-col gap-4 rounded-3xl p-4">
        <header className="flex flex-col gap-1">
          <h2 className="font-semibold">Encontrar pessoas</h2>
          <p className="text-muted text-xs text-balance">
            Busque pelo username de quem você quer acompanhar no ranking.
          </p>
        </header>

        <SearchField
          className="w-full"
          aria-label="Buscar usuários por username"
          value={term}
          onChange={setTerm}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="ana.souza" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <UserSearchResults
          term={term}
          results={results}
          isSearching={isSearching}
          error={searchError}
          onRequestSent={handleRequestSent}
        />
      </section>

      {friends === null && loadError === null ? (
        <div className="flex flex-1 items-center justify-center p-6" aria-busy="true">
          <Spinner size="lg" />
          <span className="sr-only">Carregando seus amigos</span>
        </div>
      ) : loadError !== null ? (
        <p className="text-danger py-8 text-center">{loadError}</p>
      ) : (
        <Tabs defaultSelectedKey="amigos">
          <Tabs.ListContainer>
            <Tabs.List aria-label="Amigos e solicitações">
              <Tabs.Tab id="amigos">
                Amigos ({(friends ?? []).length})
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="solicitacoes">
                Solicitações ({receivedCount})
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>

          <Tabs.Panel id="amigos" className="pt-4">
            {(friends ?? []).length === 0 ? (
              <p className="text-muted py-8 text-center text-pretty">
                Você ainda não tem amigos no Revi. Busque por um username acima
                para enviar a primeira solicitação.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {(friends ?? []).map((friend) => (
                  <FriendRow
                    key={friend.id}
                    friend={friend}
                    onRemove={handleRemoved}
                  />
                ))}
              </ul>
            )}
          </Tabs.Panel>

          <Tabs.Panel id="solicitacoes" className="flex flex-col gap-6 pt-4">
            {(requests ?? []).length === 0 ? (
              <p className="text-muted py-8 text-center">
                Nenhuma solicitação pendente.
              </p>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-medium">Recebidas</h3>
                  {receivedCount === 0 ? (
                    <p className="text-muted text-sm">
                      Ninguém te convidou por enquanto.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {(requests ?? [])
                        .filter((request) => request.direction === "received")
                        .map((request) => (
                          <FriendRequestRow
                            key={request.id}
                            request={request}
                            onAccepted={handleAccepted}
                            onResolved={handleResolved}
                          />
                        ))}
                    </ul>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-medium">Enviadas</h3>
                  {(requests ?? []).every(
                    (request) => request.direction !== "sent",
                  ) ? (
                    <p className="text-muted text-sm">
                      Você não tem solicitações aguardando resposta.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {(requests ?? [])
                        .filter((request) => request.direction === "sent")
                        .map((request) => (
                          <FriendRequestRow
                            key={request.id}
                            request={request}
                            onAccepted={handleAccepted}
                            onResolved={handleResolved}
                          />
                        ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </Tabs.Panel>
        </Tabs>
      )}
    </main>
  );
}
