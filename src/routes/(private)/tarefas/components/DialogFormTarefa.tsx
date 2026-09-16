import {
  Button,
  Calendar,
  DatePicker,
  I18nProvider,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Spinner,
  Switch,
  TextField,
  TimeField,
} from "@heroui/react";
// Único import fora da raiz do @heroui/react no repo: o `DateInputGroup` não é
// reexportado por lá, e é ele que fecha a composição do DatePicker.
import { DateInputGroup } from "@heroui/react/date-input-group";
import {
  Time,
  getLocalTimeZone,
  parseAbsoluteToLocal,
  toCalendarDate,
  toCalendarDateTime,
  today,
  type CalendarDate,
} from "@internationalized/date";
import { CalendarClock, CalendarPlus } from "lucide-react";
import { useEffect, useState } from "react";

import { ApiError } from "@/api/client";
import { listChildFolders, listMotherFolders } from "@/api/folders";
import { createTask, updateTask } from "@/api/tasks";
import { useGoogle } from "@/contexts/GoogleContext";
import { useFeedback } from "@/hooks/useFeedback";
import type { ChildFolder, MotherFolder } from "@/types/api/folder";
import type { Task } from "@/types/Task";

interface DialogFormTarefaProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** A tarefa já vem salva; `addToCalendar` diz se a Agenda ainda é pedida. */
  onSubmit: (task: Task, addToCalendar: boolean) => void;
  variant?: "edit" | "add";
  task?: Task;
}

interface FormState {
  title: string;
  motherFolderId: string | null;
  childFolderId: string | null;
  date: CalendarDate | null;
  time: Time;
  addToCalendar: boolean;
}

// 23:59 é o padrão porque "entregar até sexta" quase sempre significa o fim do
// dia — quem precisa de outra hora troca, quem não precisa não pensa nisso.
const DEFAULT_TIME = new Time(23, 59);

function createEmptyForm(hasCalendar: boolean): FormState {
  return {
    title: "",
    motherFolderId: null,
    childFolderId: null,
    date: null,
    time: DEFAULT_TIME,
    addToCalendar: hasCalendar,
  };
}

function formFromTask(task: Task, hasCalendar: boolean): FormState {
  const zoned = parseAbsoluteToLocal(task.dueAt);

  return {
    title: task.title,
    motherFolderId: task.motherFolderId,
    childFolderId: task.childFolderId,
    date: toCalendarDate(zoned),
    time: new Time(zoned.hour, zoned.minute),
    addToCalendar: hasCalendar && task.syncState !== "local",
  };
}

export function DialogFormTarefa({
  isOpen,
  onOpenChange,
  onSubmit,
  variant = "add",
  task,
}: DialogFormTarefaProps) {
  const google = useGoogle();
  const feedback = useFeedback();

  const [form, setForm] = useState<FormState>(() =>
    createEmptyForm(google.hasCalendar),
  );
  const [motherFolders, setMotherFolders] = useState<MotherFolder[] | null>(
    null,
  );
  const [childFolders, setChildFolders] = useState<ChildFolder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // O diálogo fica montado entre aberturas (só isOpen muda), então o reset
  // precisa reagir à mudança de isOpen — mesma razão do DialogFormFolder.
  useEffect(() => {
    if (!isOpen) return;

    setForm(
      task === undefined
        ? createEmptyForm(google.hasCalendar)
        : formFromTask(task, google.hasCalendar),
    );
    setError(null);
  }, [isOpen, task, google.hasCalendar]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    setMotherFolders(null);

    listMotherFolders()
      .then((result) => {
        if (!cancelled) setMotherFolders(result);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;

        setMotherFolders([]);
        setError(
          loadError instanceof ApiError
            ? loadError.detail
            : "Não foi possível carregar suas matérias. Tente novamente.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const { motherFolderId } = form;

  useEffect(() => {
    if (!isOpen || motherFolderId === null) {
      setChildFolders(null);

      return;
    }

    let cancelled = false;

    setChildFolders(null);

    listChildFolders(motherFolderId)
      .then((result) => {
        if (!cancelled) setChildFolders(result);
      })
      .catch(() => {
        // Assunto é opcional: sem a lista o campo fica vazio, e a tarefa
        // continua podendo ser salva só com a matéria.
        if (!cancelled) setChildFolders([]);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, motherFolderId]);

  const isAdding = variant === "add";
  const trimmedTitle = form.title.trim();
  const isValid =
    trimmedTitle.length >= 3 &&
    form.motherFolderId !== null &&
    form.date !== null;

  async function handleSubmit() {
    if (!isValid || isSubmitting || form.date === null) return;

    const mother = motherFolders?.find(
      (folder) => folder.id === form.motherFolderId,
    );

    if (mother === undefined) return;

    setIsSubmitting(true);
    setError(null);

    const child =
      childFolders?.find((folder) => folder.id === form.childFolderId) ?? null;

    try {
      const input = {
        title: trimmedTitle,
        motherFolderId: mother.id,
        motherFolderName: mother.name,
        motherFolderColor: mother.color,
        childFolderId: child?.id ?? null,
        childFolderName: child?.name ?? null,
        dueAt: toCalendarDateTime(form.date, form.time)
          .toDate(getLocalTimeZone())
          .toISOString(),
      };

      // Grava local primeiro: a tarefa nunca se perde porque o Google falhou.
      // Quem conversa com a Agenda é a tela, depois, e a falha vira estado na
      // linha da tarefa em vez de um erro que bloqueia o formulário.
      const saved =
        isAdding || task === undefined
          ? await createTask(input)
          : await updateTask(task.id, input);

      feedback("sucesso");
      onSubmit(saved, form.addToCalendar && google.hasCalendar);
      onOpenChange(false);
    } catch (submitError) {
      feedback("erro");
      setError(
        submitError instanceof ApiError
          ? submitError.detail
          : "Não foi possível salvar a tarefa. Tente novamente.",
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
                  <CalendarPlus className="size-5" />
                ) : (
                  <CalendarClock className="size-5" />
                )}
              </Modal.Icon>
              <Modal.Heading>
                {isAdding ? "Nova tarefa" : "Editar tarefa"}
              </Modal.Heading>
            </Modal.Header>

            <Modal.Body className="grid gap-4">
              <TextField className="w-full">
                <Label htmlFor="titulo-tarefa">
                  O que precisa ser entregue
                </Label>
                <Input
                  id="titulo-tarefa"
                  placeholder="Relatório de laboratório..."
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                />
              </TextField>

              {motherFolders === null ? (
                <div
                  className="flex items-center justify-center py-4"
                  aria-busy="true"
                >
                  <Spinner size="lg" />
                  <span className="sr-only">Carregando matérias</span>
                </div>
              ) : (
                <>
                  <Select
                    selectedKey={form.motherFolderId}
                    placeholder="Escolher matéria"
                    fullWidth
                    onSelectionChange={(key) =>
                      setForm({
                        ...form,
                        motherFolderId: key === null ? null : String(key),
                        // Trocar de matéria invalida o assunto escolhido: ele
                        // pertence à matéria anterior.
                        childFolderId: null,
                      })
                    }
                  >
                    <Label>Matéria</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {motherFolders.map((folder) => (
                          <ListBox.Item
                            key={folder.id}
                            id={folder.id}
                            textValue={folder.name}
                          >
                            <span className="flex items-center gap-2">
                              <span
                                aria-hidden="true"
                                className="size-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: folder.color }}
                              />
                              {folder.name}
                            </span>
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>

                  <Select
                    selectedKey={form.childFolderId}
                    placeholder="Sem assunto específico"
                    fullWidth
                    isDisabled={
                      form.motherFolderId === null ||
                      childFolders === null ||
                      childFolders.length === 0
                    }
                    onSelectionChange={(key) =>
                      setForm({
                        ...form,
                        childFolderId: key === null ? null : String(key),
                      })
                    }
                  >
                    <Label>Assunto (opcional)</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {(childFolders ?? []).map((folder) => (
                          <ListBox.Item
                            key={folder.id}
                            id={folder.id}
                            textValue={folder.name}
                          >
                            {folder.name}
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </>
              )}

              {/* `I18nProvider` porque o react-aria monta os segmentos e os
                  nomes de mês pela locale do *navegador*: num aparelho em
                  en-US a data viraria mm/dd/aaaa no meio de uma tela em
                  português. O app é pt-BR inteiro, então a locale é fixa. */}
              <I18nProvider locale="pt-BR">
                <div className="grid grid-cols-2 gap-3">
                  <DatePicker
                    value={form.date}
                    minValue={today(getLocalTimeZone())}
                    className="w-full"
                    onChange={(date) => setForm({ ...form, date })}
                  >
                    <Label>Data</Label>
                    {/* O `DateInputGroup` não é decoração: o react-aria ancora
                        o popover no ref do *Group*, não no do botão. Sem ele,
                        `groupRef` fica nulo e o calendário abre solto na
                        página. De quebra, o campo fica igual ao de horário ao
                        lado e aceita a data digitada. */}
                    <DateInputGroup fullWidth>
                      <DateInputGroup.Input>
                        {(segment) => (
                          <DateInputGroup.Segment segment={segment} />
                        )}
                      </DateInputGroup.Input>
                      <DateInputGroup.Suffix>
                        <DatePicker.Trigger>
                          <DatePicker.TriggerIndicator />
                        </DatePicker.Trigger>
                      </DateInputGroup.Suffix>
                    </DateInputGroup>
                    <DatePicker.Popover>
                      <Calendar>
                        <Calendar.Header>
                          <Calendar.NavButton slot="previous" />
                          <Calendar.Heading />
                          <Calendar.NavButton slot="next" />
                        </Calendar.Header>
                        <Calendar.Grid>
                          <Calendar.GridHeader>
                            {(day) => (
                              <Calendar.HeaderCell>{day}</Calendar.HeaderCell>
                            )}
                          </Calendar.GridHeader>
                          <Calendar.GridBody>
                            {(date) => <Calendar.Cell date={date} />}
                          </Calendar.GridBody>
                        </Calendar.Grid>
                      </Calendar>
                    </DatePicker.Popover>
                  </DatePicker>

                  <TimeField
                    value={form.time}
                    hourCycle={24}
                    fullWidth
                    onChange={(time) =>
                      setForm({ ...form, time: time ?? DEFAULT_TIME })
                    }
                  >
                    <Label>Horário</Label>
                    <TimeField.Group>
                      <TimeField.Input>
                        {(segment) => <TimeField.Segment segment={segment} />}
                      </TimeField.Input>
                    </TimeField.Group>
                  </TimeField>
                </div>
              </I18nProvider>

              {/* Desconectado, o lugar do switch vira o convite para conectar —
                  um interruptor que não liga nada é só uma promessa falsa. */}
              {google.hasCalendar ? (
                <Switch
                  isSelected={form.addToCalendar}
                  className="w-full"
                  onChange={(isSelected) =>
                    setForm({ ...form, addToCalendar: isSelected })
                  }
                >
                  <Switch.Content>
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                    <span className="flex flex-col">
                      <Label>Adicionar ao Google Agenda</Label>
                      <span className="text-muted text-xs">
                        Com lembretes um dia e uma hora antes da entrega.
                      </span>
                    </span>
                  </Switch.Content>
                </Switch>
              ) : google.isConfigured ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-muted text-sm text-pretty">
                    Conecte o Google para receber o lembrete no celular.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    isPending={google.status === "connecting"}
                    onPress={() => void google.connect()}
                  >
                    Conectar Google
                  </Button>
                </div>
              ) : null}

              {error !== null ? (
                <p role="alert" className="text-danger text-sm text-pretty">
                  {error}
                </p>
              ) : null}
            </Modal.Body>

            <Modal.Footer>
              <Button
                className="w-full"
                isDisabled={!isValid || isSubmitting}
                onPress={() => void handleSubmit()}
              >
                {isAdding ? "Criar tarefa" : "Salvar tarefa"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
