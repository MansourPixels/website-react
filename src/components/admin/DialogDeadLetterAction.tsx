import { Button, Modal } from "@heroui/react";
import { RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";

import { countOf } from "@/utils/adminFormat";
import { DEAD_LETTER_MOVE_MAX, queueLabel } from "@/utils/adminQueues";

export type DeadLetterAction = "replay" | "discard";

interface DialogDeadLetterActionProps {
  /** A fila, quantas mensagens ela tem e o que fazer; `null` fecha o diálogo. */
  target: { queue: string; messages: number; action: DeadLetterAction } | null;
  onClose: () => void;
  onConfirm: (queue: string, action: DeadLetterAction, limit: number) => void;
}

/** Confirma reenviar ou descartar as mensagens de uma fila morta, com a contagem e, no reenvio, um limite opcional. */
export function DialogDeadLetterAction({ target, onClose, onConfirm }: DialogDeadLetterActionProps) {
  // O conteúdo segue a última fila aberta, para o texto não trocar enquanto o diálogo fecha.
  const [shown, setShown] = useState(target);
  const [limitText, setLimitText] = useState("");
  if (target !== null && target !== shown) {
    setShown(target);
    setLimitText("");
  }

  const isReplay = shown?.action === "replay";
  const all = Math.min(shown?.messages ?? 0, DEAD_LETTER_MOVE_MAX);
  const typed = limitText.trim() === "" ? null : Number(limitText);
  const isLimitValid = typed === null || (Number.isInteger(typed) && typed >= 1 && typed <= DEAD_LETTER_MOVE_MAX);
  const limit = typed !== null && isLimitValid ? Math.min(typed, all) : all;

  return (
    <Modal isOpen={target !== null} onOpenChange={(isOpen) => (isOpen ? null : onClose())}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-110">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className={isReplay ? "bg-accent-soft text-accent" : "bg-danger-soft text-danger"}>
                {isReplay ? <RotateCcw className="size-5" /> : <Trash2 className="size-5" />}
              </Modal.Icon>
              <Modal.Heading>{isReplay ? "Reenviar mensagens" : "Descartar mensagens"}</Modal.Heading>
            </Modal.Header>
            {shown !== null ? (
              <Modal.Body className="flex flex-col gap-3">
                <p className="text-sm text-pretty">
                  {queueLabel(shown.queue)}: {countOf(shown.messages, "mensagem", "mensagens")} na fila.
                  {shown.messages > DEAD_LETTER_MOVE_MAX
                    ? ` Cada vez vão no máximo ${DEAD_LETTER_MOVE_MAX}.`
                    : null}
                </p>
                {isReplay ? (
                  <>
                    <p className="rounded-lg bg-warning-soft p-2 text-sm text-warning text-pretty">
                      Corrija a causa antes: uma mensagem que falhar de novo volta para esta fila.
                    </p>
                    <label className="flex flex-col gap-1 text-sm">
                      Reenviar só as primeiras N (opcional)
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={DEAD_LETTER_MOVE_MAX}
                        value={limitText}
                        placeholder={`Todas (${all})`}
                        onChange={(event) => setLimitText(event.target.value)}
                        aria-invalid={!isLimitValid}
                        className="rounded-lg bg-surface px-2 py-1.5 text-foreground shadow-surface"
                      />
                      {!isLimitValid ? (
                        <span className="text-xs text-danger">Use um número inteiro de 1 a {DEAD_LETTER_MOVE_MAX}.</span>
                      ) : null}
                    </label>
                  </>
                ) : (
                  <p className="text-sm text-muted text-pretty">
                    As mensagens serão apagadas e não há como recuperá-las.
                  </p>
                )}
              </Modal.Body>
            ) : null}
            <Modal.Footer className="grid grid-cols-2 gap-2">
              <Button variant="secondary" className="w-full" onPress={onClose}>
                Cancelar
              </Button>
              <Button
                variant={isReplay ? "primary" : "danger"}
                className="w-full"
                isDisabled={!isLimitValid || limit === 0}
                onPress={() => {
                  if (target !== null) onConfirm(target.queue, target.action, limit);
                }}
              >
                {isReplay ? `Reenviar ${limit}` : `Descartar ${limit}`}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
