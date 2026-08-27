import {
  Button,
  Checkbox,
  CheckboxGroup,
  Modal,
  Spinner,
} from "@heroui/react";
import { ListChecks } from "lucide-react";
import { useEffect, useState } from "react";

import { ApiError } from "@/api/client";
import { listMotherFolders } from "@/api/folders";
import type { MotherFolder } from "@/types/api/folder";

const MAX_DISCIPLINES = 3;

interface DialogSelecionarDisciplinasProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onGenerateAutomatic: () => void;
  onGenerateSelected: (motherFolderIds: string[]) => void;
}

export function DialogSelecionarDisciplinas({
  isOpen,
  onOpenChange,
  onGenerateAutomatic,
  onGenerateSelected,
}: DialogSelecionarDisciplinasProps) {
  const [disciplines, setDisciplines] = useState<MotherFolder[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setSelected([]);
    setError(null);

    listMotherFolders()
      .then((result) => {
        if (!cancelled) setDisciplines(result);
      })
      .catch((apiError: unknown) => {
        if (cancelled) return;

        setError(
          apiError instanceof ApiError
            ? apiError.detail
            : "Não foi possível carregar suas disciplinas. Tente novamente.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  function handleAutomatic() {
    onOpenChange(false);
    onGenerateAutomatic();
  }

  function handleSelected() {
    if (selected.length === 0) return;

    onOpenChange(false);
    onGenerateSelected(selected);
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-90">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="bg-default text-foreground">
                <ListChecks className="size-5" />
              </Modal.Icon>
              <Modal.Heading>Escolher disciplinas</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-4">
              <p className="text-sm text-muted">
                Selecione até {MAX_DISCIPLINES} disciplinas para focar a
                trilha, ou gere automaticamente com base no seu desempenho.
              </p>

              {error !== null ? (
                <p role="alert" className="text-danger text-sm text-pretty">
                  {error}
                </p>
              ) : disciplines === null ? (
                <div
                  className="flex items-center justify-center py-6"
                  aria-busy="true"
                >
                  <Spinner size="lg" />
                  <span className="sr-only">Carregando disciplinas</span>
                </div>
              ) : disciplines.length === 0 ? (
                <p className="text-muted text-sm">
                  Você ainda não tem nenhuma disciplina cadastrada.
                </p>
              ) : (
                <CheckboxGroup
                  value={selected}
                  onChange={setSelected}
                  className="grid gap-2"
                >
                  {disciplines.map((discipline) => {
                    const isChecked = selected.includes(discipline.id);
                    const isLimitReached =
                      !isChecked && selected.length >= MAX_DISCIPLINES;

                    return (
                      <Checkbox
                        key={discipline.id}
                        value={discipline.id}
                        isDisabled={isLimitReached}
                      >
                        <Checkbox.Content className="flex items-center gap-2">
                          <Checkbox.Control>
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                          <span
                            className="size-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: discipline.color }}
                          />
                          {discipline.name}
                        </Checkbox.Content>
                      </Checkbox>
                    );
                  })}
                </CheckboxGroup>
              )}
            </Modal.Body>
            <Modal.Footer className="grid gap-2">
              <Button
                className="w-full"
                onPress={handleSelected}
                isDisabled={selected.length === 0}
              >
                Gerar com estas disciplinas
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onPress={handleAutomatic}
              >
                Gerar automaticamente
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
