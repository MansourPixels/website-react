import {
  Button,
  Modal,
  ProgressBar,
  Spinner,
  Tabs,
  cn,
} from "@heroui/react";
import {
  ClipboardList,
  FileText,
  FileUp,
  Layers,
  Network,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { createContent, listReviMaterials, uploadContent } from "@/api/classrooms";
import { ApiError } from "@/api/client";
import { useFeedback } from "@/hooks/useFeedback";
import type {
  ClassroomContent,
  ClassroomContentKind,
  ReviMaterial,
} from "@/types/api/classroom";

const materialIcons: Record<ReviMaterial["kind"], LucideIcon> = {
  flashcards: Layers,
  summary: FileText,
  quiz: ClipboardList,
  mindmap: Network,
};

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
  const [materials, setMaterials] = useState<ReviMaterial[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const feedback = useFeedback();

  useEffect(() => {
    if (!isOpen) return;

    setSelected([]);
    setError(null);
    setFile(null);
    setUploadProgress(0);

    let cancelled = false;

    listReviMaterials()
      .then((result) => {
        if (!cancelled) setMaterials(result);
      })
      .catch(() => {
        if (!cancelled) setMaterials([]);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  function toggleMaterial(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  async function handleAddMaterials() {
    if (selected.length === 0 || isSubmitting || materials === null) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const created: ClassroomContent[] = [];

      for (const id of selected) {
        const material = materials.find((item) => item.id === id);

        if (material === undefined) continue;

        created.push(
          await createContent(classroomId, folderId, {
            kind: material.kind,
            title: material.title,
            description: material.description,
            reviMaterialId: material.reviMaterialId,
          }),
        );
      }

      feedback("sucesso");
      onSubmit(created);
      onOpenChange(false);
    } catch (apiError) {
      feedback("erro");
      setError(
        apiError instanceof ApiError
          ? apiError.detail
          : "Não foi possível adicionar o conteúdo. Tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpload() {
    if (file === null || isSubmitting) return;

    if (file.size > MAX_FILE_SIZE) {
      setError("O arquivo passa de 20 MB. Envie uma versão menor.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setUploadProgress(0);

    // Progresso simulado: `apiFetch` não reporta bytes enviados no momento —
    // a tela já está preparada para exibi-los quando isso existir.
    const timer = setInterval(() => {
      setUploadProgress((current) => Math.min(90, current + 15));
    }, 120);

    try {
      const kind: Extract<ClassroomContentKind, "pdf" | "image"> =
        file.type.startsWith("image/") ? "image" : "pdf";
      const created = await uploadContent(classroomId, folderId, {
        kind,
        title: file.name.replace(/\.[^.]+$/, ""),
        description: "Arquivo enviado para a turma.",
        file,
      });

      setUploadProgress(100);
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
    } finally {
      clearInterval(timer);
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
                <Plus className="size-5" />
              </Modal.Icon>
              <Modal.Heading>Adicionar conteúdo</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              <Tabs defaultSelectedKey="revi">
                <Tabs.ListContainer>
                  <Tabs.List aria-label="Origem do conteúdo">
                    <Tabs.Tab id="revi">
                      Do Revi
                      <Tabs.Indicator />
                    </Tabs.Tab>
                    <Tabs.Tab id="arquivo">
                      Enviar arquivo
                      <Tabs.Indicator />
                    </Tabs.Tab>
                  </Tabs.List>
                </Tabs.ListContainer>

                <Tabs.Panel id="revi" className="flex flex-col gap-4 pt-4">
                  {materials === null ? (
                    <div
                      className="flex items-center justify-center py-6"
                      aria-busy="true"
                    >
                      <Spinner size="sm" />
                      <span className="sr-only">Carregando seus materiais</span>
                    </div>
                  ) : materials.length === 0 ? (
                    <p className="text-muted py-4 text-center text-sm text-pretty">
                      Você ainda não gerou materiais no Revi. Fotografe o
                      caderno para criar o primeiro.
                    </p>
                  ) : (
                    <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto">
                      {materials.map((material) => {
                        const Icon = materialIcons[material.kind] ?? FileText;
                        const isSelected = selected.includes(material.id);

                        return (
                          <li key={material.id}>
                            <Button
                              variant="ghost"
                              className={cn(
                                "flex h-auto w-full items-center gap-3 rounded-xl border-2 px-3 py-2 text-left",
                                isSelected
                                  ? "border-accent"
                                  : "border-transparent",
                              )}
                              aria-pressed={isSelected}
                              onPress={() => toggleMaterial(material.id)}
                            >
                              <span className="bg-default text-muted flex size-9 shrink-0 items-center justify-center rounded-xl">
                                <Icon className="size-4" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">
                                  {material.title}
                                </span>
                                <span className="text-muted block truncate text-xs font-normal">
                                  {material.description}
                                </span>
                              </span>
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  <Button
                    className="w-full"
                    isDisabled={selected.length === 0 || isSubmitting}
                    onPress={handleAddMaterials}
                  >
                    {isSubmitting
                      ? "Adicionando…"
                      : selected.length <= 1
                        ? "Adicionar à pasta"
                        : `Adicionar ${selected.length} itens`}
                  </Button>
                </Tabs.Panel>

                <Tabs.Panel id="arquivo" className="flex flex-col gap-4 pt-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/*"
                    className="sr-only"
                    onChange={(event) => {
                      setFile(event.target.files?.[0] ?? null);
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

                  {isSubmitting ? (
                    <ProgressBar
                      value={uploadProgress}
                      aria-label="Progresso do envio"
                    />
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
