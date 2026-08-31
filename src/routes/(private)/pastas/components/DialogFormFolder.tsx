import { Button, Input, Label, Modal, TextField } from "@heroui/react";
import { FolderPen, FolderPlus } from "lucide-react";
import { useEffect, useState } from "react";

import { createMotherFolder, updateMotherFolder } from "@/api/folders";
import { useFeedback } from "@/hooks/useFeedback";
import { ApiError } from "@/api/client";
import { ColorPicker } from "@/components/ColorPicker";
import type { MotherFolder } from "@/types/api/folder";
import { getRandomColor } from "@/utils/color";

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

interface DialogFormFolderProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (folder: MotherFolder) => void;
  variant?: "edit" | "add";
  folder?: MotherFolder;
}

interface FormState {
  name: string;
  color: string;
}

function createEmptyForm(): FormState {
  return { name: "", color: getRandomColor() };
}

export function DialogFormFolder({
  isOpen,
  onOpenChange,
  onSubmit,
  variant = "add",
  folder,
}: DialogFormFolderProps) {
  const [form, setForm] = useState<FormState>(() => folder ?? createEmptyForm());
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // O diálogo fica montado entre aberturas (só isOpen muda), então o reset
  // precisa reagir à mudança de isOpen — chamar isso a partir de onSubmit
  // não cobre a próxima abertura via botão externo (que não passa pelo
  // onOpenChange do Modal).
  useEffect(() => {
    if (isOpen) {
      setForm(folder ?? createEmptyForm());
      setError(null);
    }
  }, [isOpen, folder]);

  const isAdding = variant === "add";
  const trimmedName = form.name.trim();
  const isValid =
    trimmedName.length >= 3 && HEX_COLOR_PATTERN.test(form.color);

  const feedback = useFeedback();

  async function handleSubmit() {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result =
        isAdding || folder === undefined
          ? await createMotherFolder(trimmedName, form.color)
          : await updateMotherFolder(folder.id, {
              name: trimmedName,
              color: form.color,
            });

      feedback("sucesso");
      onSubmit(result);
      onOpenChange(false);
    } catch (apiError) {
      feedback("erro");
      setError(
        apiError instanceof ApiError
          ? apiError.detail
          : "Não foi possível salvar a pasta. Tente novamente.",
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
                  <FolderPlus className="size-5" />
                ) : (
                  <FolderPen className="size-5" />
                )}
              </Modal.Icon>
              <Modal.Heading>
                {isAdding
                  ? "Adicionar nova pasta"
                  : `Editar pasta ${folder?.name ?? ""}`}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-4">
              <TextField className="w-full">
                <Label htmlFor="nome-pasta">Nome da pasta</Label>
                <Input
                  placeholder="Matemática, Português..."
                  id="nome-pasta"
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                />
              </TextField>
              <ColorPicker
                label="Cor da pasta"
                value={form.color}
                onChange={(color) => setForm({ ...form, color })}
              />
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
                {isAdding ? "Adicionar pasta" : "Salvar pasta"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
