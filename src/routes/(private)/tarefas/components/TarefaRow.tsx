import { Button, ButtonGroup, Checkbox, Popover, Spinner, cn } from "@heroui/react";
import { CalendarCheck, CalendarX, Ellipsis, Pencil, Trash } from "lucide-react";
import { useState } from "react";

import type { Task } from "@/types/Task";
import { formatDueDate, formatUploadDate } from "@/utils/time";

interface TarefaRowProps {
  task: Task;
  isOverdue: boolean;
  /** A Agenda só entra em cena com o Google conectado e o escopo concedido. */
  canSync: boolean;
  isSyncing: boolean;
  onToggleDone: (task: Task, done: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onRetrySync: (task: Task) => void;
}

export function TarefaRow({
  task,
  isOverdue,
  canSync,
  isSyncing,
  onToggleDone,
  onEdit,
  onDelete,
  onRetrySync,
}: TarefaRowProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Sem fechar o menu antes, o popover fica pendurado sobre o diálogo que
  // acabou de abrir — mesmo cuidado do FolderCard.
  function openDialog(open: () => void) {
    setIsMenuOpen(false);
    open();
  }

  const subject =
    task.childFolderName === null
      ? task.motherFolderName
      : `${task.motherFolderName} · ${task.childFolderName}`;

  return (
    <li className="flex items-center gap-3 rounded-xl bg-background p-3">
      <Checkbox
        isSelected={task.done}
        aria-label={
          task.done
            ? `Reabrir a tarefa ${task.title}`
            : `Concluir a tarefa ${task.title}`
        }
        onChange={(isSelected) => onToggleDone(task, isSelected)}
      >
        <Checkbox.Content>
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
        </Checkbox.Content>
      </Checkbox>

      <span
        aria-hidden="true"
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: task.motherFolderColor }}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <p
          className={cn(
            "truncate font-medium",
            task.done && "text-muted line-through",
          )}
        >
          {task.title}
        </p>
        <p className="text-muted truncate text-xs">{subject}</p>

        {/* A falha de sincronização mora na linha da tarefa que falhou, não numa
            faixa global: é ali que está a ação de refazê-la. */}
        {task.syncState === "falhou" && canSync && !task.done ? (
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 h-auto w-fit p-0 text-danger-soft-foreground"
            isDisabled={isSyncing}
            onPress={() => onRetrySync(task)}
          >
            Tentar de novo na Agenda
          </Button>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isSyncing ? (
          <>
            <Spinner size="sm" />
            <span className="sr-only">Sincronizando com a Agenda</span>
          </>
        ) : task.syncState === "sincronizada" ? (
          <CalendarCheck
            className="size-4 text-muted"
            aria-label="Na Google Agenda"
          />
        ) : task.syncState === "falhou" ? (
          <CalendarX
            className="size-4 text-danger"
            aria-label="Não foi para a Google Agenda"
          />
        ) : null}

        {/* Atrasada colore o prazo, e só ele: tarja vermelha na linha inteira
            transformaria uma lista de entregas num painel de alarme. */}
        <p
          className={cn(
            "text-xs tabular-nums",
            isOverdue ? "text-danger" : "text-muted",
          )}
        >
          {task.done
            ? `Concluída ${formatUploadDate(task.completedAt ?? task.dueAt)}`
            : formatDueDate(task.dueAt)}
        </p>

        <Popover isOpen={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <Button
            variant="ghost"
            isIconOnly
            size="sm"
            aria-label={`Opções da tarefa ${task.title}`}
          >
            <Ellipsis className="size-4" />
          </Button>
          <Popover.Content className="max-w-64 rounded-xl" placement="bottom end">
            <Popover.Dialog className="p-2">
              <ButtonGroup orientation="vertical">
                <Button
                  variant="ghost"
                  className="w-full justify-start rounded-t-lg border-b text-accent-soft-foreground"
                  onPress={() => openDialog(() => onEdit(task))}
                >
                  <Pencil /> Editar tarefa
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start rounded-b-lg text-danger"
                  onPress={() => openDialog(() => onDelete(task))}
                >
                  <Trash /> Excluir tarefa
                </Button>
              </ButtonGroup>
            </Popover.Dialog>
          </Popover.Content>
        </Popover>
      </div>
    </li>
  );
}
