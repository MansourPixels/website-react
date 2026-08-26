import type { Subject } from "@/types/Subject";
import { Button, Input, Label, Modal, TextField } from "@heroui/react";
import { FilePlus, SquarePen } from "lucide-react";
import { useState } from "react";

interface DialogFormSubjectProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (subject: Subject) => void;
  variant?: "edit" | "add";
  subject?: Subject;
}

function createEmptySubject(): Subject {
  return {
    id: crypto.randomUUID(),
    name: "",
    materials: [],
  };
}

export function DialogFormSubject({
  isOpen,
  onOpenChange,
  onSubmit,
  variant = "edit",
  subject,
}: DialogFormSubjectProps) {
  const [form, setForm] = useState<Subject>(
    () => subject ?? createEmptySubject(),
  );

  function handleOpenChange(open: boolean) {
    if (open) setForm(subject ?? createEmptySubject());
    onOpenChange(open);
  }

  function handleSubmit() {
    onSubmit({ ...form, name: form.name.trim() });
    handleOpenChange(false);
  }

  const isAdding = variant === "add";

  return (
    <Modal isOpen={isOpen} onOpenChange={handleOpenChange}>
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
            <Modal.Body>
              <TextField className="w-full">
                <Label htmlFor="nome-assunto">Nome do assunto</Label>
                <Input
                  autoFocus
                  id="nome-assunto"
                  placeholder="Equação de terceiro grau..."
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                />
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button
                className="w-full"
                onPress={handleSubmit}
                isDisabled={form.name.trim().length < 3}
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
