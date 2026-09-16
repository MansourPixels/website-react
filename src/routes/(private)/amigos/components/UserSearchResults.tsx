import { Button, Spinner } from "@heroui/react";
import { Check, Clock, UserPlus } from "lucide-react";
import { useState } from "react";

import { ApiError } from "@/api/client";
import { sendFriendRequest } from "@/api/friends";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { UserIdentity } from "@/components/UserIdentity";
import { useFeedback } from "@/hooks/useFeedback";
import type {
  FriendRequest,
  FriendshipStatus,
  UserSearchResult,
} from "@/types/api/friend";
import { formatXp } from "@/utils/ranking";

interface UserSearchResultsProps {
  term: string;
  results: UserSearchResult[] | null;
  isSearching: boolean;
  error: string | null;
  /** Reflete o envio na lista de solicitações da página, sem recarregar tudo. */
  onRequestSent: (request: FriendRequest) => void;
  /** Refaz a busca do termo atual depois de uma falha. */
  onRetry: () => void;
}

function SearchResultRow({
  user,
  onRequestSent,
}: {
  user: UserSearchResult;
  onRequestSent: (request: FriendRequest) => void;
}) {
  const [status, setStatus] = useState<FriendshipStatus>(user.friendship);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const feedback = useFeedback();

  async function handleAdd() {
    if (isSending) return;

    setIsSending(true);
    setError(null);

    try {
      const request = await sendFriendRequest(user.id);

      feedback("sucesso");
      setStatus("request-sent");
      onRequestSent(request);
    } catch (apiError) {
      feedback("erro");
      setError(
        apiError instanceof ApiError
          ? apiError.detail
          : "Não foi possível enviar a solicitação. Tente novamente.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <li className="bg-surface shadow-surface flex flex-col gap-2 rounded-xl p-3">
      <div className="flex items-center gap-3">
        <UserIdentity
          user={user}
          size="sm"
          linkToProfile
          caption={<span className="tabular-nums">{formatXp(user.xp)}</span>}
          className="flex-1"
        />

        {status === "self" ? (
          <span className="text-muted shrink-0 text-xs">Você</span>
        ) : status === "friends" ? (
          <span className="text-success flex shrink-0 items-center gap-1 text-xs">
            <Check className="size-3.5" />
            Amigos
          </span>
        ) : status === "request-sent" ? (
          <span className="text-muted flex shrink-0 items-center gap-1 text-xs">
            <Clock className="size-3.5" />
            Pendente
          </span>
        ) : status === "request-received" ? (
          <span className="text-muted shrink-0 text-xs">
            Já te convidou
          </span>
        ) : (
          <Button
            size="sm"
            className="shrink-0"
            isDisabled={isSending}
            onPress={handleAdd}
          >
            <UserPlus className="size-4" />
            Adicionar
          </Button>
        )}
      </div>

      {error !== null ? (
        <p role="alert" className="text-danger text-sm text-pretty">
          {error}
        </p>
      ) : null}
    </li>
  );
}

export function UserSearchResults({
  term,
  results,
  isSearching,
  error,
  onRequestSent,
  onRetry,
}: UserSearchResultsProps) {
  if (term.trim().length < 2) {
    return (
      <EmptyState isCompact>
        Digite pelo menos duas letras do username para buscar.
      </EmptyState>
    );
  }

  if (isSearching) {
    return (
      <div className="flex items-center justify-center py-6" aria-busy="true">
        <Spinner size="sm" />
        <span className="sr-only">Buscando usuários</span>
      </div>
    );
  }

  if (error !== null) {
    return (
      <ErrorState isCompact onRetry={onRetry}>
        {error}
      </ErrorState>
    );
  }

  if (results === null || results.length === 0) {
    return (
      <EmptyState isCompact>
        Nenhum usuário encontrado para “{term.trim()}”.
      </EmptyState>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {results.map((user) => (
        <SearchResultRow
          key={user.id}
          user={user}
          onRequestSent={onRequestSent}
        />
      ))}
    </ul>
  );
}
