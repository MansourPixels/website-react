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

function normalizeInviteCode(value: string): string {
  const trimmed = value.trim();

  // O botão de convite copia a URL completa. Aceitá-la aqui evita que a
  // pessoa precise descobrir e extrair o código manualmente.
  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/^\/turmas\/convite\/([^/]+)\/?$/);

    if (match !== null) return match[1].toLowerCase();
  } catch {
    // Não é uma URL; trata como código simples abaixo.
  }

  // O backend gera UUIDs sem hífens em minúsculas e a busca no PostgreSQL é
  // sensível a maiúsculas/minúsculas.
  return trimmed.toLowerCase();
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

  const inviteCode = normalizeInviteCode(code);

  async function handleSubmit() {
    if (inviteCode.length === 0 || isChecking) return;

    setIsChecking(true);
    setError(null);

    try {
      await getInviteByCode(inviteCode);

      onOpenChange(false);
      navigate(`/turmas/convite/${inviteCode}`);
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
            <Modal.Body className="flex flex-col gap-4">
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
                isDisabled={inviteCode.length === 0 || isChecking}
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
