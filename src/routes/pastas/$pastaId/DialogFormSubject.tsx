import { Button, Input, Label, Modal, TextField } from "@heroui/react";
import { SquarePen } from "lucide-react";
import { useState } from "react";
import type { Subject } from "../../../types/Subject";

interface DialogFormSubjectProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (subject: Subject) => void;
  subject: Subject;
}

export function DialogFormSubject({
  isOpen,
  onOpenChange,
  onSubmit,
  subject,
}: DialogFormSubjectProps) {
  const [name, setName] = useState(subject.name);

  function handleOpenChange(open: boolean) {
    // Ao abrir, parte sempre do nome atual do assunto para que um
    // cancelamento anterior não deixe rascunho no campo.
    if (open) setName(subject.name);
    onOpenChange(open);
  }

  function handleSubmit() {
    onSubmit({ ...subject, name: name.trim() });
    handleOpenChange(false);
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-90">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="bg-default text-foreground">
                <SquarePen className="size-5" />
              </Modal.Icon>
              <Modal.Heading>Renomear assunto</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
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
            </Modal.Body>
            <Modal.Footer>
              <Button
                className="w-full"
                onPress={handleSubmit}
                isDisabled={name.trim().length < 3}
              >
                Salvar assunto
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
