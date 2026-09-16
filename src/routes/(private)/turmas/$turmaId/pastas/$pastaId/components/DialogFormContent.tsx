import { Button, Input, Label, Modal, TextField } from "@heroui/react";
import { PencilLine } from "lucide-react";
import { useEffect, useState } from "react";

import { updateContent } from "@/api/classrooms";
import { ApiError } from "@/api/client";
import { useFeedback } from "@/hooks/useFeedback";
import type { ClassroomContent } from "@/types/api/classroom";

interface DialogFormContentProps {
  classroomId: string;
  folderId: string;
  content: ClassroomContent;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (content: ClassroomContent) => void;
}

/** Só título e descrição: o material em si é gerado ou enviado, não editado aqui. */
export function DialogFormContent({
  classroomId,
  folderId,
  content,
  isOpen,
  onOpenChange,
  onSubmit,
}: DialogFormContentProps) {
  const [title, setTitle] = useState(content.title);
  const [description, setDescription] = useState(content.description);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setTitle(content.title);
    setDescription(content.description);
    setError(null);
  }, [isOpen, content]);

  const trimmedTitle = title.trim();
  const isValid = trimmedTitle.length >= 3;

  const feedback = useFeedback();

  async function handleSubmit() {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateContent(classroomId, folderId, content.id, {
        title: trimmedTitle,
        description: description.trim(),
      });

      feedback("sucesso");
      onSubmit(result);
      onOpenChange(false);
    } catch (apiError) {
      feedback("erro");
      setError(
        apiError instanceof ApiError
          ? apiError.detail
          : "Não foi possível salvar o conteúdo. Tente novamente.",
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
                <PencilLine className="size-5" />
              </Modal.Icon>
              <Modal.Heading>Editar conteúdo</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-4">
              <TextField className="w-full">
                <Label htmlFor="titulo-conteudo">Título</Label>
                <Input
                  id="titulo-conteudo"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </TextField>

              <TextField className="w-full">
                <Label htmlFor="descricao-conteudo">Descrição</Label>
                <Input
                  id="descricao-conteudo"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
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
                Salvar
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
