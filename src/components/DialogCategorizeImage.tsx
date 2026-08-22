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
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { ColorPicker } from "@/components/ColorPicker";
import { categorizeImage } from "@/mocks/categorization";
import type { Folder } from "@/types/Folder";
import { getRandomColor } from "@/utils/color";
import { normalizeText } from "@/utils/text";

const NEW_FOLDER_KEY = "nova-pasta";

export interface ImageCategorization {
  folder: Folder;
  isNewFolder: boolean;
  subjectName: string;
}

interface DialogCategorizeImageProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  folders: Folder[];
  onSubmit: (categorization: ImageCategorization) => void;
}

export function DialogCategorizeImage({
  isOpen,
  onOpenChange,
  folders,
  onSubmit,
}: DialogCategorizeImageProps) {
  const [isCategorizing, setIsCategorizing] = useState(true);
  const [folderKey, setFolderKey] = useState<string>(NEW_FOLDER_KEY);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState(getRandomColor);
  const [subjectName, setSubjectName] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    let isCurrent = true;

    setIsCategorizing(true);

    categorizeImage().then(({ disciplina, assunto }) => {
      if (!isCurrent) return;

      const suggestedFolder = folders.find(
        (folder) => normalizeText(folder.name) === normalizeText(disciplina),
      );

      setFolderKey(suggestedFolder?.id ?? NEW_FOLDER_KEY);
      setNewFolderName(suggestedFolder ? "" : disciplina);
      setNewFolderColor(getRandomColor());
      setSubjectName(assunto);
      setIsCategorizing(false);
    });

    return () => {
      isCurrent = false;
    };
  }, [isOpen, folders]);

  const isNewFolder = folderKey === NEW_FOLDER_KEY;
  const isValid =
    subjectName.trim().length >= 3 &&
    (!isNewFolder || newFolderName.trim().length >= 3);

  function handleSubmit() {
    const selectedFolder = folders.find((folder) => folder.id === folderKey);

    onSubmit({
      folder: selectedFolder ?? {
        id: crypto.randomUUID(),
        name: newFolderName.trim(),
        color: newFolderColor,
        amount: 0,
      },
      isNewFolder,
      subjectName: subjectName.trim(),
    });

    onOpenChange(false);
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop isDismissable={false}>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-90">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="bg-default text-foreground">
                <Sparkles className="size-5" />
              </Modal.Icon>
              <Modal.Heading>
                {isCategorizing
                  ? "Revi IA está analisando..."
                  : "Confirme a categorização"}
              </Modal.Heading>
            </Modal.Header>

            {isCategorizing ? (
              <Modal.Body className="flex flex-col items-center gap-3 py-8 text-center">
                <Spinner size="lg" />
                <p className="text-muted text-sm">
                  O Revi IA está categorizando a disciplina e o assunto desta
                  imagem.
                </p>
              </Modal.Body>
            ) : (
              <Modal.Body className="grid gap-4">
                <p className="text-muted text-sm">
                  Encontramos esta categorização para a imagem. Ajuste os campos
                  caso algo não esteja correto.
                </p>

                <Select
                  className="w-full"
                  selectedKey={folderKey}
                  onSelectionChange={(key) => setFolderKey(String(key))}
                >
                  <Label>Disciplina</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {folders.map((folder) => (
                        <ListBox.Item key={folder.id} id={folder.id}>
                          {folder.name}
                        </ListBox.Item>
                      ))}
                      <ListBox.Item id={NEW_FOLDER_KEY}>
                        Nova pasta
                      </ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>

                {isNewFolder ? (
                  <>
                    <TextField className="w-full">
                      <Label htmlFor="nome-nova-pasta">Nome da pasta</Label>
                      <Input
                        id="nome-nova-pasta"
                        placeholder="Matemática, Português..."
                        value={newFolderName}
                        onChange={(event) =>
                          setNewFolderName(event.target.value)
                        }
                      />
                    </TextField>
                    <ColorPicker
                      label="Cor da pasta"
                      value={newFolderColor}
                      onChange={setNewFolderColor}
                    />
                  </>
                ) : null}

                <TextField className="w-full">
                  <Label htmlFor="nome-assunto-imagem">Assunto</Label>
                  <Input
                    id="nome-assunto-imagem"
                    placeholder="Equação de terceiro grau..."
                    value={subjectName}
                    onChange={(event) => setSubjectName(event.target.value)}
                  />
                </TextField>
              </Modal.Body>
            )}

            <Modal.Footer>
              <Button
                className="w-full"
                onPress={handleSubmit}
                isDisabled={isCategorizing || !isValid}
              >
                Salvar imagem
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
