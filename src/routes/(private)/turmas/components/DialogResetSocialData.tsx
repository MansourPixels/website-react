import { Button, Modal } from "@heroui/react";
import { RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

import { ApiError } from "@/api/client";
import { resetMockData } from "@/api/mockBackend";
import { useFeedback } from "@/hooks/useFeedback";

interface DialogResetSocialDataProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
}

/**
 * Volta Amigos, Ranking e Turmas ao estado semeado. Some junto com o mock
 * quando o backend real entrar.
 */
export function DialogResetSocialData({
  isOpen,
  onOpenChange,
  onConfirm,
}: DialogResetSocialDataProps) {
  const [error, setError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (isOpen) setError(null);
  }, [isOpen]);

  const feedback = useFeedback();

  async function handleConfirm() {
    if (isResetting) return;

    setIsResetting(true);
    setError(null);

    try {
      await resetMockData();

      feedback("sucesso");
      onConfirm();
      onOpenChange(false);
    } catch (apiError) {
      feedback("erro");
      setError(
        apiError instanceof ApiError
          ? apiError.detail
          : "Não foi possível restaurar os dados. Tente novamente.",
      );
    } finally {
      setIsResetting(false);
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
                <RotateCcw className="size-5" />
              </Modal.Icon>
              <Modal.Heading>Restaurar dados de demonstração</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-2">
              <p className="text-muted">
                As turmas, pastas, conteúdos, amizades e convites criados nesta
                demonstração voltam ao estado inicial. Esta ação não pode ser
                desfeita.
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
                isDisabled={isResetting}
              >
                Restaurar
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
