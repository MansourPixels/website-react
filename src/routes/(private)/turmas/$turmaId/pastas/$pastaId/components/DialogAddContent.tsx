import {
  Button,
  Modal,
  Spinner,
  Tabs,
} from "@heroui/react";
import { FileUp, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { uploadClassroomContent } from "@/api/classrooms";
import { ApiError } from "@/api/client";
import { useFeedback } from "@/hooks/useFeedback";
import type { ClassroomContent } from "@/types/api/classroom";

const MAX_FILE_SIZE = 20 * 1_048_576;

interface DialogAddContentProps {
  classroomId: string;
  folderId: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (contents: ClassroomContent[]) => void;
}

export function DialogAddContent({
  classroomId,
  folderId,
  isOpen,
  onOpenChange,
  onSubmit,
}: DialogAddContentProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const feedback = useFeedback();

  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setFile(null);
    setTitle("");
    setDescription("");
  }, [isOpen]);

  async function handleUpload() {
    if (file === null || isSubmitting) return;

    if (file.size > MAX_FILE_SIZE) {
      setError("O arquivo passa de 20 MB. Envie uma versão menor.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await uploadClassroomContent(classroomId, folderId, {
        file,
        title: title.trim() || file.name.replace(/\.[^.]+$/, ""),
        description: description.trim() || undefined,
      });

      feedback("sucesso");
      onSubmit([created]);
      onOpenChange(false);
    } catch (apiError) {
      feedback("erro");
      setError(
        apiError instanceof ApiError
          ? apiError.detail
          : "Não foi possível enviar o arquivo. Tente novamente.",
      );
    } finally { setIsSubmitting(false); }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-100">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="bg-default text-foreground">
                <Plus className="size-5" />
              </Modal.Icon>
              <Modal.Heading>Adicionar conteúdo</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
               <Tabs defaultSelectedKey="arquivo">
                <Tabs.ListContainer>
                  <Tabs.List aria-label="Origem do conteúdo">
                    <Tabs.Tab id="arquivo">
                      Enviar arquivo
                      <Tabs.Indicator />
                    </Tabs.Tab>
                  </Tabs.List>
                </Tabs.ListContainer>

                <Tabs.Panel id="arquivo" className="flex flex-col gap-4 pt-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/*"
                    className="sr-only"
                    onChange={(event) => {
                      const nextFile = event.target.files?.[0] ?? null;
                      setFile(nextFile);
                      if (nextFile !== null && title.length === 0) setTitle(nextFile.name.replace(/\.[^.]+$/, ""));
                      setError(null);
                    }}
                  />

                  <Button
                    variant="secondary"
                    className="w-full"
                    onPress={() => fileInputRef.current?.click()}
                  >
                    <FileUp className="size-4" />
                    {file === null ? "Escolher arquivo" : "Trocar arquivo"}
                  </Button>

                   {file !== null ? (
                    <p className="text-muted text-sm break-all">
                      {file.name}
                    </p>
                   ) : (
                    <p className="text-muted text-xs text-pretty">
                      Aceita PDF e imagens, até 20 MB.
                    </p>
                   )}

                   <label className="grid gap-1 text-sm">
                     Título
                     <input className="border-separator rounded-lg border px-3 py-2" value={title} onChange={(event) => setTitle(event.target.value)} />
                   </label>
                   <label className="grid gap-1 text-sm">
                     Descrição (opcional)
                     <input className="border-separator rounded-lg border px-3 py-2" value={description} onChange={(event) => setDescription(event.target.value)} />
                   </label>

                   {isSubmitting ? (
                     <div className="flex items-center gap-2" role="status"><Spinner size="sm" /> Enviando arquivo…</div>
                  ) : null}

                  <Button
                    className="w-full"
                    isDisabled={file === null || isSubmitting}
                    onPress={handleUpload}
                  >
                    {isSubmitting ? "Enviando…" : "Enviar para a pasta"}
                  </Button>
                </Tabs.Panel>
              </Tabs>

              {error !== null ? (
                <p role="alert" className="text-danger text-sm text-pretty">
                  {error}
                </p>
              ) : null}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
