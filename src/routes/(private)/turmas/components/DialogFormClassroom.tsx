import { Button, Input, Label, Modal, TextField } from "@heroui/react";
import { PencilLine, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { createClassroom, updateClassroom } from "@/api/classrooms";
import { ApiError } from "@/api/client";
import { ColorPicker } from "@/components/ColorPicker";
import { useFeedback } from "@/hooks/useFeedback";
import type { Classroom } from "@/types/api/classroom";
import { getRandomColor } from "@/utils/color";

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

interface DialogFormClassroomProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (classroom: Classroom) => void;
  variant?: "add" | "edit";
  classroom?: Classroom;
}

interface FormState {
  name: string;
  description: string;
  color: string;
}

function createEmptyForm(): FormState {
  return { name: "", description: "", color: getRandomColor() };
}

export function DialogFormClassroom({
  isOpen,
  onOpenChange,
  onSubmit,
  variant = "add",
  classroom,
}: DialogFormClassroomProps) {
  const [form, setForm] = useState<FormState>(createEmptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // O diálogo fica montado entre aberturas (só isOpen muda), então o reset
  // precisa reagir à mudança de isOpen.
  useEffect(() => {
    if (!isOpen) return;

    setForm(
      classroom === undefined
        ? createEmptyForm()
        : {
            name: classroom.name,
            description: classroom.description,
            color: classroom.color,
          },
    );
    setError(null);
  }, [isOpen, classroom]);

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
      const payload = {
        name: trimmedName,
        description: form.description.trim(),
        color: form.color,
      };
      const result =
        isAdding || classroom === undefined
          ? await createClassroom(payload)
          : await updateClassroom(classroom.id, payload);

      feedback("sucesso");
      onSubmit(result);
      onOpenChange(false);
    } catch (apiError) {
      feedback("erro");
      setError(
        apiError instanceof ApiError
          ? apiError.detail
          : "Não foi possível salvar a turma. Tente novamente.",
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
                  <Users className="size-5" />
                ) : (
                  <PencilLine className="size-5" />
                )}
              </Modal.Icon>
              <Modal.Heading>
                {isAdding ? "Criar turma" : `Editar ${classroom?.name ?? ""}`}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              <TextField className="w-full">
                <Label htmlFor="nome-turma">Nome da turma</Label>
                <Input
                  id="nome-turma"
                  placeholder="5-A Matemática"
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                />
              </TextField>

              <TextField className="w-full">
                <Label htmlFor="descricao-turma">Descrição</Label>
                <Input
                  id="descricao-turma"
                  placeholder="Turma da manhã, prof. Rejane"
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                />
              </TextField>

              <ColorPicker
                label="Cor da turma"
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
                {isAdding ? "Criar turma" : "Salvar turma"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
