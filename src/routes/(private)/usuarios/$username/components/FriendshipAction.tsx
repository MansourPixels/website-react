import { Button, ButtonGroup, Popover, Spinner } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { Check, UserMinus, UserPlus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { ApiError } from "@/api/client";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  removeFriend,
  sendFriendRequest,
} from "@/api/friends";
import { useFeedback } from "@/hooks/useFeedback";
import type { PublicProfile } from "@/types/api/profile";

interface NextFriendship {
  friendship: PublicProfile["friendship"];
  pendingRequestId: string | null;
}

interface FriendshipActionProps {
  profile: PublicProfile;
  /** Devolve o novo estado da relação para a página refletir sem recarregar. */
  onChange: (
    friendship: PublicProfile["friendship"],
    pendingRequestId: string | null,
  ) => void;
}

/**
 * O botão de amizade do perfil público. Cada estado da relação tem uma ação
 * própria, e o estado novo sobe para a página — recarregar o perfil inteiro
 * depois de um clique seria desproporcional.
 */
export function FriendshipAction({
  profile,
  onChange,
}: FriendshipActionProps) {
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const feedback = useFeedback();

  /**
   * A ação devolve o estado que a relação passa a ter — inclusive o id da nova
   * solicitação, que só existe depois da resposta do serviço.
   */
  async function run(
    action: () => Promise<NextFriendship>,
    errorMessage: string,
  ) {
    if (isBusy) return;

    setIsBusy(true);
    setError(null);

    try {
      const next = await action();

      feedback(next.friendship === "none" ? "exclusao" : "sucesso");
      onChange(next.friendship, next.pendingRequestId);
    } catch (apiError) {
      feedback("erro");
      setError(apiError instanceof ApiError ? apiError.detail : errorMessage);
    } finally {
      setIsBusy(false);
    }
  }

  if (profile.friendship === "self") {
    return (
      <Link
        to="/perfil"
        className={buttonVariants({
          variant: "secondary",
          size: "sm",
          className: "shrink-0",
        })}
      >
        Ver seu perfil
      </Link>
    );
  }

  const { username } = profile.user;
  const requestId = profile.pendingRequestId;

  return (
    <div className="flex shrink-0 flex-col items-center gap-2 sm:items-end">
      {isBusy ? (
        <Spinner size="sm" />
      ) : profile.friendship === "none" ? (
        <Button
          size="sm"
          onPress={() =>
            run(async () => {
              const request = await sendFriendRequest(profile.user.id);

              return {
                friendship: "request-sent",
                pendingRequestId: request.id,
              };
            }, "Não foi possível enviar a solicitação. Tente novamente.")
          }
        >
          <UserPlus className="size-4" />
          Adicionar
        </Button>
      ) : profile.friendship === "request-sent" ? (
        <Button
          size="sm"
          variant="secondary"
          isDisabled={requestId === null}
          onPress={() =>
            run(async () => {
              await cancelFriendRequest(requestId ?? "");

              return { friendship: "none", pendingRequestId: null };
            }, "Não foi possível cancelar a solicitação. Tente novamente.")
          }
        >
          Cancelar solicitação
        </Button>
      ) : profile.friendship === "request-received" ? (
        <div className="flex gap-2">
          <Button
            size="sm"
            isDisabled={requestId === null}
            onPress={() =>
              run(async () => {
                await acceptFriendRequest(requestId ?? "", profile.user);

                return { friendship: "friends", pendingRequestId: null };
              }, "Não foi possível aceitar a solicitação. Tente novamente.")
            }
          >
            <Check className="size-4" />
            Aceitar
          </Button>
          <Button
            size="sm"
            variant="secondary"
            isDisabled={requestId === null}
            onPress={() =>
              run(async () => {
                await declineFriendRequest(requestId ?? "");

                return { friendship: "none", pendingRequestId: null };
              }, "Não foi possível recusar a solicitação. Tente novamente.")
            }
          >
            Recusar
          </Button>
        </div>
      ) : (
        <Popover>
          <Button size="sm" variant="secondary">
            <Check className="size-4" />
            Amigos
          </Button>
          <Popover.Content>
            <Popover.Dialog className="p-0">
              <ButtonGroup orientation="vertical" className="w-48">
                <Button
                  variant="ghost"
                  className="text-danger justify-start"
                  onPress={() =>
                    run(async () => {
                      await removeFriend(profile.user.id);

                      return { friendship: "none", pendingRequestId: null };
                    }, "Não foi possível desfazer a amizade. Tente novamente.")
                  }
                >
                  <UserMinus className="size-4" />
                  Desfazer amizade
                </Button>
              </ButtonGroup>
            </Popover.Dialog>
          </Popover.Content>
        </Popover>
      )}

      {error !== null ? (
        <p
          role="alert"
          className="text-danger max-w-56 text-xs text-pretty sm:text-right"
        >
          {error}
        </p>
      ) : null}

      <span className="sr-only">
        {profile.friendship === "friends"
          ? `Você e @${username} são amigos.`
          : profile.friendship === "request-sent"
            ? `Solicitação enviada para @${username}.`
            : profile.friendship === "request-received"
              ? `@${username} enviou uma solicitação para você.`
              : `Você não é amigo de @${username}.`}
      </span>
    </div>
  );
}
