import { Button, Input, Label, Modal, TextField } from "@heroui/react";
import { KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { getInviteByCode } from "@/api/classrooms";
import { ApiError } from "@/api/client";
import { useFeedback } from "@/hooks/useFeedback";

interface DialogJoinByCodeProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

/**
 * Valida o código antes de navegar: mandar a pessoa para uma tela de convite
 * quebrado seria pior do que dizer o erro onde ela digitou.
 */
export function DialogJoinByCode({
  isOpen,
  onOpenChange,
}: DialogJoinByCodeProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const navigate = useNavigate();
  const feedback = useFeedback();

  useEffect(() => {
    if (!isOpen) return;

    setCode("");
    setError(null);
  }, [isOpen]);

  const trimmed = code.trim();

  async function handleSubmit() {
    if (trimmed.length === 0 || isChecking) return;

    setIsChecking(true);
    setError(null);

    try {
      await getInviteByCode(trimmed);

      onOpenChange(false);
      navigate(`/turmas/convite/${trimmed.toUpperCase()}`);
    } catch (apiError) {
      feedback("erro");
      setError(
        apiError instanceof ApiError
          ? apiError.detail
          : "Não foi possível validar o código. Tente novamente.",
      );
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-90">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="bg-default text-foreground">
                <KeyRound className="size-5" />
              </Modal.Icon>
              <Modal.Heading>Entrar com código</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-4">
              <TextField className="w-full">
                <Label htmlFor="codigo-convite">Código do convite</Label>
                <Input
                  id="codigo-convite"
                  placeholder="MAT3B2026"
                  autoCapitalize="characters"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                />
              </TextField>

              {error !== null ? (
                <p role="alert" className="text-danger text-sm text-pretty">
                  {error}
                </p>
              ) : null}
            </Modal.Body>
            <Modal.Footer>
              <Button
                className="w-full"
                onPress={handleSubmit}
                isDisabled={trimmed.length === 0 || isChecking}
              >
                {isChecking ? "Verificando…" : "Continuar"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
