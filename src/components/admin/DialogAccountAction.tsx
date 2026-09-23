import { Button, Modal } from "@heroui/react";
import { UserCheck, UserX } from "lucide-react";
import { useState } from "react";

import type { AdminUser } from "@/types/api/admin";

export type AccountAction = "disable" | "enable";

interface DialogAccountActionProps {
  /** A conta e o que fazer com ela; `null` fecha o diálogo. */
  target: { user: AdminUser; action: AccountAction } | null;
  onClose: () => void;
  onConfirm: (user: AdminUser, action: AccountAction) => void;
}

/** Confirma desativar ou reativar uma conta, com o nome e o e-mail da pessoa. */
export function DialogAccountAction({ target, onClose, onConfirm }: DialogAccountActionProps) {
  // O conteúdo segue a última conta aberta, para o texto não trocar enquanto o diálogo fecha.
  const [shown, setShown] = useState(target);
  if (target !== null && target !== shown) setShown(target);

  const isDisable = shown?.action === "disable";

  return (
    <Modal isOpen={target !== null} onOpenChange={(isOpen) => (isOpen ? null : onClose())}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-100">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className={isDisable ? "bg-danger-soft text-danger" : "bg-success-soft text-success"}>
                {isDisable ? <UserX className="size-5" /> : <UserCheck className="size-5" />}
              </Modal.Icon>
              <Modal.Heading>{isDisable ? "Desativar conta" : "Reativar conta"}</Modal.Heading>
            </Modal.Header>
            {shown !== null ? (
              <Modal.Body className="flex flex-col gap-2">
                <p className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{shown.user.username}</span>
                  <span className="truncate text-sm text-muted">{shown.user.email ?? "Sem e-mail"}</span>
                </p>
                <p className="text-sm text-muted text-pretty">
                  {isDisable
                    ? "A pessoa sai de todos os dispositivos e não consegue entrar de novo até a conta ser reativada."
                    : "A pessoa volta a conseguir entrar, com os mesmos dados de antes."}
                </p>
              </Modal.Body>
            ) : null}
            <Modal.Footer className="grid grid-cols-2 gap-2">
              <Button variant="secondary" className="w-full" onPress={onClose}>
                Cancelar
              </Button>
              <Button
                variant={isDisable ? "danger" : "primary"}
                className="w-full"
                onPress={() => {
                  if (target !== null) onConfirm(target.user, target.action);
                }}
              >
                {isDisable ? "Desativar conta" : "Reativar conta"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
