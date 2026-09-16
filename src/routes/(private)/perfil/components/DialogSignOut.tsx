import { Button, Modal } from "@heroui/react";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { useAuth } from "@/contexts/AuthContext";

interface DialogSignOutProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

/**
 * Sair da conta encerra a sessão de estudo em curso, então a ação passa pelo
 * mesmo molde de confirmação das destrutivas.
 */
export function DialogSignOut({ isOpen, onOpenChange }: DialogSignOutProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) setError(null);
  }, [isOpen]);

  async function handleConfirm() {
    if (isSigningOut) return;

    setIsSigningOut(true);
    setError(null);

    try {
      await signOut();
      navigate("/", { replace: true });
    } catch {
      setError("Não foi possível sair da conta. Tente novamente.");
    } finally {
      // Sem o `finally` uma falha deixaria o botão desabilitado para sempre.
      setIsSigningOut(false);
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
                <LogOut className="size-5" />
              </Modal.Icon>
              <Modal.Heading>Sair da conta</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-2">
              <p className="text-muted">
                Você vai precisar entrar de novo para continuar estudando. Se
                houver uma sessão de estudo em andamento, ela é encerrada. A
                conexão com o Google também é encerrada neste aparelho.
              </p>
              {error !== null ? (
                <p
                  role="alert"
                  className="text-danger-soft-foreground text-sm text-pretty"
                >
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
                isPending={isSigningOut}
                onPress={() => void handleConfirm()}
              >
                Sair da conta
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
