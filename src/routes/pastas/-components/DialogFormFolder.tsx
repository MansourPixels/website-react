import { Button, Input, Label, Modal, TextField } from "@heroui/react";
import { FolderPen, FolderPlus } from "lucide-react";
import { useState } from "react";
import { ColorPicker } from "@/components/ColorPicker";
import type { Folder } from "@/types/Folder";
import { getRandomColor } from "@/utils/color";

interface DialogFormFolderProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (folder: Folder) => void;
  variant?: "edit" | "add";
  folder?: Folder;
}

function createEmptyFolder(): Folder {
  return {
    id: crypto.randomUUID(),
    name: "",
    color: getRandomColor(),
    amount: 0,
  };
}

export function DialogFormFolder({
  isOpen,
  onOpenChange,
  onSubmit,
  variant = "add",
  folder,
}: DialogFormFolderProps) {
  const [form, setForm] = useState<Folder>(() => folder ?? createEmptyFolder());

  function handleOpenChange(open: boolean) {
    if (open) setForm(folder ?? createEmptyFolder());
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
            </Modal.Body>
            <Modal.Footer>
              <Button
                className="w-full"
                onPress={handleSubmit}
                isDisabled={form.name.trim().length < 3}
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
