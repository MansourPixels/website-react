import { Button, Input, Label, Modal, TextField } from "@heroui/react";
import { FolderPen, FolderPlus } from "lucide-react";
import { useEffect, useState } from "react";

import { createFolder, updateFolder } from "@/api/classrooms";
import { ApiError } from "@/api/client";
import { ColorPicker } from "@/components/ColorPicker";
import { useFeedback } from "@/hooks/useFeedback";
import type { ClassroomFolder } from "@/types/api/classroom";
import { getRandomColor } from "@/utils/color";

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

interface DialogFormClassroomFolderProps {
  classroomId: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (folder: ClassroomFolder) => void;
  variant?: "add" | "edit";
  folder?: ClassroomFolder;
}

interface FormState {
  name: string;
  color: string;
}

function createEmptyForm(): FormState {
  return { name: "", color: getRandomColor() };
}

export function DialogFormClassroomFolder({
  classroomId,
  isOpen,
  onOpenChange,
  onSubmit,
  variant = "add",
  folder,
}: DialogFormClassroomFolderProps) {
  const [form, setForm] = useState<FormState>(createEmptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setForm(
      folder === undefined
        ? createEmptyForm()
        : { name: folder.name, color: folder.color },
    );
    setError(null);
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
      const payload = { name: trimmedName, color: form.color };
      const result =
        isAdding || folder === undefined
          ? await createFolder(classroomId, payload)
          : await updateFolder(classroomId, folder.id, payload);

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
                  ? "Nova pasta da turma"
                  : `Editar pasta ${folder?.name ?? ""}`}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              <TextField className="w-full">
                <Label htmlFor="nome-pasta-turma">Nome da pasta</Label>
                <Input
                  id="nome-pasta-turma"
                  placeholder="Trigonometria, Provas antigas..."
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
                {isAdding ? "Criar pasta" : "Salvar pasta"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
