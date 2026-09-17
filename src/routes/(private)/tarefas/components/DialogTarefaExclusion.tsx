import { Button, Modal } from "@heroui/react";
import { Trash } from "lucide-react";
import { useEffect, useState } from "react";

import { deleteTask } from "@/api/tasks";
import { useFeedback } from "@/hooks/useFeedback";
import type { Task } from "@/types/Task";

interface DialogTarefaExclusionProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (task: Task) => void;
  task: Task;
}

export function DialogTarefaExclusion({
  isOpen,
  onOpenChange,
  onConfirm,
  task,
}: DialogTarefaExclusionProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) setError(null);
  }, [isOpen]);

  const feedback = useFeedback();

  const hasEvent = task.googleEventId !== null;

  async function handleConfirm() {
    if (isDeleting) return;

    setIsDeleting(true);
    setError(null);

    try {
      // Um `DELETE` só: o servidor publica a remoção do evento de forma
      // assíncrona depois de responder, então não existe mais o risco de apagar
      // a tarefa e deixar um lembrete órfão tocando no celular do aluno.
      await deleteTask(task.id);

      feedback("exclusao");
      onConfirm(task);
      onOpenChange(false);
    } catch {
      feedback("erro");
      setError("Não foi possível excluir a tarefa. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-90">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="bg-danger-soft text-danger">
                <Trash className="size-5" />
              </Modal.Icon>
              <Modal.Heading>Excluir tarefa</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-2">
              <p className="text-muted">
                <strong className="text-foreground font-medium">
                  {task.title}
                </strong>{" "}
                sai da sua lista de entregas
                {hasEvent ? " e da sua Google Agenda" : ""}. Esta ação não pode
                ser desfeita.
              </p>
              {error !== null ? (
                <p role="alert" className="text-danger text-sm text-pretty">
                  {error}
                </p>
              ) : null}
            </Modal.Body>
            <Modal.Footer className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                className="w-full"
                onPress={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                className="w-full"
                onPress={() => void handleConfirm()}
                isDisabled={isDeleting}
              >
                Excluir tarefa
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
