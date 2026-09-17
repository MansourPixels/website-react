import { Button, Input, Label, Modal, TextField } from "@heroui/react";
import { FilePlus, SquarePen } from "lucide-react";
import { useEffect, useState } from "react";

import { createChildFolder, updateChildFolder } from "@/api/folders";
import { useFeedback } from "@/hooks/useFeedback";
import { ApiError } from "@/api/client";
import type { ChildFolder } from "@/types/api/folder";

interface DialogFormSubjectProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (subject: ChildFolder) => void;
  variant?: "edit" | "add";
  subject?: ChildFolder;
  // Só necessário no variant "add": pasta mãe onde o novo assunto é criado.
  motherFolderId?: string;
}

export function DialogFormSubject({
  isOpen,
  onOpenChange,
  onSubmit,
  variant = "edit",
  subject,
  motherFolderId,
}: DialogFormSubjectProps) {
  const [name, setName] = useState(subject?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // O diálogo fica montado entre aberturas (só isOpen muda), então o reset
  // precisa reagir à mudança de isOpen — chamar isso a partir de onSubmit
  // não cobre a próxima abertura via botão externo (que não passa pelo
  // onOpenChange do Modal).
  useEffect(() => {
    if (isOpen) {
      setName(subject?.name ?? "");
      setError(null);
    }
  }, [isOpen, subject]);

  const isAdding = variant === "add";
  const trimmedName = name.trim();
  const isValid = trimmedName.length >= 3;

  const feedback = useFeedback();

  async function handleSubmit() {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result =
        isAdding && motherFolderId !== undefined
          ? await createChildFolder(motherFolderId, trimmedName)
          : subject !== undefined
            ? await updateChildFolder(subject.id, trimmedName)
            : undefined;

      if (result === undefined) return;

      feedback("sucesso");
      onSubmit(result);
      onOpenChange(false);
    } catch (apiError) {
      feedback("erro");
      setError(
        apiError instanceof ApiError
          ? apiError.detail
          : "Não foi possível salvar o assunto. Tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
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
                {isAdding ? (
                  <FilePlus className="size-5" />
                ) : (
                  <SquarePen className="size-5" />
                )}
              </Modal.Icon>
              <Modal.Heading>
                {isAdding ? "Adicionar novo assunto" : "Renomear assunto"}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              <TextField className="w-full">
                <Label htmlFor="nome-assunto">Nome do assunto</Label>
                <Input
                  autoFocus
                  id="nome-assunto"
                  placeholder="Equação de terceiro grau..."
                  value={name}
                  onChange={(event) => setName(event.target.value)}
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
                isDisabled={!isValid || isSubmitting}
              >
                {isAdding ? "Adicionar assunto" : "Salvar assunto"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
