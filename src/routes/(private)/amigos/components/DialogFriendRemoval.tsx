import { Button, Modal } from "@heroui/react";
import { UserMinus } from "lucide-react";
import { useEffect, useState } from "react";

import { ApiError } from "@/api/client";
import { removeFriend } from "@/api/friends";
import { useFeedback } from "@/hooks/useFeedback";
import type { PublicUser } from "@/types/api/social";

// Genérico em `PublicUser` porque o perfil público desfaz a mesma amizade sem
// ter um `Friend` completo em mãos — é o mesmo diálogo, não uma cópia.
interface DialogFriendRemovalProps<TUser extends PublicUser> {
  friend: TUser;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (friend: TUser) => void;
}

export function DialogFriendRemoval<TUser extends PublicUser>({
  friend,
  isOpen,
  onOpenChange,
  onConfirm,
}: DialogFriendRemovalProps<TUser>) {
  const [error, setError] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // O diálogo fica montado entre aberturas (só isOpen muda) — reseta o erro
  // de uma tentativa anterior sempre que reabre.
  useEffect(() => {
    if (isOpen) setError(null);
  }, [isOpen]);

  const feedback = useFeedback();

  async function handleConfirm() {
    if (isRemoving) return;

    setIsRemoving(true);
    setError(null);

    try {
      await removeFriend(friend.id);

      feedback("exclusao");
      onConfirm(friend);
      onOpenChange(false);
    } catch (apiError) {
      // 404: a amizade já não existe (desfeita do outro lado) — some da lista
      // em vez de travar num amigo fantasma.
      if (apiError instanceof ApiError && apiError.status === 404) {
        onConfirm(friend);
        onOpenChange(false);
        return;
      }

      feedback("erro");
      setError(
        apiError instanceof ApiError
          ? apiError.detail
          : "Não foi possível desfazer a amizade. Tente novamente.",
      );
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-90">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="bg-danger-soft text-danger">
                <UserMinus className="size-5" />
              </Modal.Icon>
              <Modal.Heading>Desfazer amizade</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-2">
              <p className="text-muted">
                @{friend.username} sai da sua lista e do seu ranking de amigos.
                Vocês podem se adicionar de novo depois.
              </p>
              {error !== null ? (
                <p role="alert" className="text-danger text-sm text-pretty">
                  {error}
                </p>
              ) : null}
            </Modal.Body>
            <Modal.Footer className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                className="w-full"
                onPress={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                className="w-full"
                onPress={handleConfirm}
                isDisabled={isRemoving}
              >
                Desfazer
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
