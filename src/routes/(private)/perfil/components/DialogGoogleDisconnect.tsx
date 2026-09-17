import { Button, Modal } from "@heroui/react";
import { Unplug } from "lucide-react";
import { useState } from "react";

import { useGoogle } from "@/contexts/GoogleContext";

interface DialogGoogleDisconnectProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function DialogGoogleDisconnect({ isOpen, onOpenChange }: DialogGoogleDisconnectProps) {
  const { disconnect } = useGoogle();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDisconnect() {
    setIsDisconnecting(true);
    setError(null);

    try {
      await disconnect();
      onOpenChange(false);
    } catch {
      setError("Não foi possível desconectar o Google. Tente novamente.");
    } finally {
      setIsDisconnecting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-90">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="bg-danger-soft text-danger"><Unplug className="size-5" /></Modal.Icon>
              <Modal.Heading>Desconectar Google</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-2">
              <p className="text-muted">Isso remove a conexão local entre sua conta Google e o Revi.</p>
              {error !== null ? <p role="alert" className="text-danger-soft-foreground text-sm">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onPress={() => onOpenChange(false)}>Cancelar</Button>
              <Button variant="danger" isPending={isDisconnecting} onPress={() => void handleDisconnect()}>
                Desconectar
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
