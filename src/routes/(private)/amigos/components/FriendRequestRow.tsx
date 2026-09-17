import { Button, Spinner } from "@heroui/react";
import { Check, X } from "lucide-react";
import { useState } from "react";

import { ApiError } from "@/api/client";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
} from "@/api/friends";
import { UserIdentity } from "@/components/UserIdentity";
import { useFeedback } from "@/hooks/useFeedback";
import type { Friend, FriendRequest } from "@/types/api/friend";

interface FriendRequestRowProps {
  request: FriendRequest;
  /** Recebe o novo amigo quando a solicitação recebida é aceita. */
  onAccepted: (request: FriendRequest, friend: Friend) => void;
  onResolved: (request: FriendRequest) => void;
}

export function FriendRequestRow({
  request,
  onAccepted,
  onResolved,
}: FriendRequestRowProps) {
  const [pendingAction, setPendingAction] = useState<
    "accept" | "decline" | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const feedback = useFeedback();

  async function run(action: "accept" | "decline") {
    if (pendingAction !== null) return;

    setPendingAction(action);
    setError(null);

    try {
      if (action === "accept") {
        const friend = await acceptFriendRequest(request.id, request.user);

        feedback("sucesso");
        onAccepted(request, friend);
        return;
      }

      if (request.direction === "received") {
        await declineFriendRequest(request.id);
      } else {
        await cancelFriendRequest(request.id);
      }

      onResolved(request);
    } catch (apiError) {
      feedback("erro");
      setError(
        apiError instanceof ApiError
          ? apiError.detail
          : "Não foi possível responder à solicitação. Tente novamente.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  const isReceived = request.direction === "received";

  return (
    <li className="bg-surface shadow-surface flex flex-col gap-3 rounded-xl p-3">
      <div className="flex items-center gap-3">
        <UserIdentity
          user={request.user}
          size="sm"
          linkToProfile
          caption={isReceived ? "Quer ser seu amigo" : "Aguardando resposta"}
          className="flex-1"
        />

        {pendingAction !== null ? (
          <Spinner size="sm" />
        ) : isReceived ? (
          <div className="flex shrink-0 gap-2">
            <Button
              size="sm"
              aria-label={`Aceitar solicitação de @${request.user.username}`}
              onPress={() => run("accept")}
            >
              <Check className="size-4" />
              Aceitar
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="secondary"
              aria-label={`Recusar solicitação de @${request.user.username}`}
              onPress={() => run("decline")}
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            className="shrink-0"
            onPress={() => run("decline")}
          >
            Cancelar
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
