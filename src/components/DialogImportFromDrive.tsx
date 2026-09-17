import {
  Button,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Spinner,
  TextField,
} from "@heroui/react";
import { HardDriveDownload } from "lucide-react";
import { useEffect, useState } from "react";

import { ApiError } from "@/api/client";
import { importFromDrive } from "@/api/content";
import {
  createChildFolder,
  createMotherFolder,
  listChildFolders,
  listMotherFolders,
} from "@/api/folders";
import { ColorPicker } from "@/components/ColorPicker";
import type { UploadDestination } from "@/components/DialogCategorizeImage";
import type { DriveFileRef } from "@/types/Google";
import type { ChildFolder, MotherFolder } from "@/types/api/folder";
import { getRandomColor } from "@/utils/color";

interface DialogImportFromDriveProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** O arquivo escolhido no Picker. Só o id e o nome viajam; os bytes, nunca. */
  file: DriveFileRef | null;
  onImported: (destination: UploadDestination) => void;
}

/**
 * Onde guardar um material que vem do Drive.
 *
 * Diferente da câmera, aqui **não** há sugestão da Revi IA: o servidor baixa os
 * bytes direto do Google e eles nunca chegam ao navegador, que é justamente o
 * ponto — um PDF de aula de 40 MB no 4G do ônibus custaria o dobro do tráfego
 * pelo pior caminho. Sem os bytes no aparelho não há o que mandar para o
 * `folder-suggestion`, então a escolha é do aluno, explícita.
 *
 * A saída de emergência é a mesma do `DialogCategorizeImage`: quem ainda não tem
 * a pasta cria ali mesmo, sem sair do fluxo para a tela de pastas e voltar.
 */
export function DialogImportFromDrive({
  isOpen,
  onOpenChange,
  file,
  onImported,
}: DialogImportFromDriveProps) {
  const [motherFolders, setMotherFolders] = useState<MotherFolder[] | null>(
    null,
  );
  const [childFolders, setChildFolders] = useState<ChildFolder[] | null>(null);

  const [motherFolderId, setMotherFolderId] = useState<string | null>(null);
  const [childFolderId, setChildFolderId] = useState<string | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [newMotherName, setNewMotherName] = useState("");
  const [newMotherColor, setNewMotherColor] = useState(getRandomColor);
  const [newChildName, setNewChildName] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // O diálogo fica montado entre aberturas, então o reset reage ao isOpen —
  // mesma razão do DialogFormTarefa.
  useEffect(() => {
    if (!isOpen) return;

    setMotherFolderId(null);
    setChildFolderId(null);
    setIsCreating(false);
    setNewMotherName("");
    setNewMotherColor(getRandomColor());
    setNewChildName("");
    setError(null);
  }, [isOpen, file]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    setMotherFolders(null);

    listMotherFolders()
      .then((result) => {
        if (cancelled) return;

        setMotherFolders(result);
        // Sem nenhuma pasta ainda, criar é o único caminho: já abre por ali em
        // vez de mostrar um select vazio que não leva a lugar nenhum.
        if (result.length === 0) setIsCreating(true);
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

  useEffect(() => {
    if (!isOpen || isCreating || motherFolderId === null) {
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
        if (!cancelled) setChildFolders([]);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, isCreating, motherFolderId]);

  const isValid = isCreating
    ? newMotherName.trim().length >= 3 && newChildName.trim().length >= 3
    : childFolderId !== null;

  async function handleSubmit() {
    if (!isValid || isSubmitting || file === null) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const destination = isCreating
        ? await (async () => {
            const mother = await createMotherFolder(
              newMotherName.trim(),
              newMotherColor,
            );
            const child = await createChildFolder(
              mother.id,
              newChildName.trim(),
            );

            return { motherFolderId: mother.id, childFolderId: child.id };
          })()
        : {
            motherFolderId: motherFolderId ?? "",
            childFolderId: childFolderId ?? "",
          };

      await importFromDrive(file.id, destination.childFolderId);

      onOpenChange(false);
      onImported(destination);
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.detail
          : "Não foi possível importar o arquivo do Drive. Tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-100">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="bg-default text-foreground">
                <HardDriveDownload className="size-5" />
              </Modal.Icon>
              <Modal.Heading>Onde guardar este material?</Modal.Heading>
            </Modal.Header>

            <Modal.Body className="flex flex-col gap-4">
              {file !== null ? (
                <p className="text-muted text-sm text-pretty">
                  <strong className="text-foreground font-medium">
                    {file.name}
                  </strong>{" "}
                  vem do seu Drive direto para o Revi, sem passar por este
                  aparelho.
                </p>
              ) : null}

              {motherFolders === null ? (
                <div
                  className="flex items-center justify-center py-4"
                  aria-busy="true"
                >
                  <Spinner size="lg" />
                  <span className="sr-only">Carregando matérias</span>
                </div>
              ) : isCreating ? (
                <>
                  <TextField className="w-full">
                    <Label htmlFor="nova-materia-drive">Nome da matéria</Label>
                    <Input
                      id="nova-materia-drive"
                      placeholder="Biologia, Matemática..."
                      value={newMotherName}
                      onChange={(event) => setNewMotherName(event.target.value)}
                    />
                  </TextField>

                  <ColorPicker
                    label="Cor da matéria"
                    value={newMotherColor}
                    onChange={setNewMotherColor}
                  />

                  <TextField className="w-full">
                    <Label htmlFor="novo-assunto-drive">Assunto</Label>
                    <Input
                      id="novo-assunto-drive"
                      placeholder="Genética, Equação do 2º grau..."
                      value={newChildName}
                      onChange={(event) => setNewChildName(event.target.value)}
                    />
                  </TextField>

                  {motherFolders.length > 0 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-fit p-0"
                      onPress={() => setIsCreating(false)}
                    >
                      Escolher uma matéria que já existe
                    </Button>
                  ) : null}
                </>
              ) : (
                <>
                  <Select
                    selectedKey={motherFolderId}
                    placeholder="Escolher matéria"
                    fullWidth
                    onSelectionChange={(key) => {
                      setMotherFolderId(key === null ? null : String(key));
                      // Trocar de matéria invalida o assunto: ele pertence à
                      // matéria anterior.
                      setChildFolderId(null);
                    }}
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
                    selectedKey={childFolderId}
                    placeholder={
                      motherFolderId === null
                        ? "Escolha a matéria primeiro"
                        : "Escolher assunto"
                    }
                    fullWidth
                    isDisabled={
                      motherFolderId === null ||
                      childFolders === null ||
                      childFolders.length === 0
                    }
                    onSelectionChange={(key) =>
                      setChildFolderId(key === null ? null : String(key))
                    }
                  >
                    <Label>Assunto</Label>
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

                  {/* O material do Drive costuma ser o primeiro de um assunto
                      novo: sem esta saída o aluno teria de abandonar o fluxo,
                      criar a pasta e recomeçar a escolha no Picker. */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-fit p-0"
                    onPress={() => setIsCreating(true)}
                  >
                    {motherFolderId !== null &&
                    childFolders !== null &&
                    childFolders.length === 0
                      ? "Esta matéria ainda não tem assuntos — criar uma nova"
                      : "Criar uma matéria e um assunto"}
                  </Button>
                </>
              )}

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
                {isSubmitting ? "Importando..." : "Importar do Drive"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
