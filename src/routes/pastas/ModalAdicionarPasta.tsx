"use client";

import { Button, Input, Label, Modal, TextField } from "@heroui/react";
import { FolderPlus } from "lucide-react";
import { FABButton } from "../../components/FABButton";

export function ModalAdicionarPasta() {
  return (
    <Modal>
      <FABButton />

      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-90">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="bg-default text-foreground">
                <FolderPlus className="size-5" />
              </Modal.Icon>
              <Modal.Heading>Adicionar nova pasta</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <TextField className="w-full">
                <Label>Nome da pasta</Label>
                <Input placeholder="Matemática, Português..." />
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button className="w-full" slot="close">
                Adicionar pasta
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}