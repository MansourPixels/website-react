import { Button, Input, Label, Modal, Spinner, TextField } from "@heroui/react";
import { Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "@/api/client";
import { suggestFolder, uploadContent } from "@/api/content";
import {
  createOrReuseChildFolder,
  createOrReuseMotherFolder,
  listChildFolders,
  listMotherFolders,
} from "@/api/folders";
import { ColorPicker } from "@/components/ColorPicker";
import type { CapturedFile } from "@/types/capture";
import { getRandomColor } from "@/utils/color";
import { ensureUploadFilename } from "@/utils/materials";

export interface UploadDestination {
  motherFolderId: string;
  childFolderId: string;
}

interface DialogCategorizeImageProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  file: CapturedFile | null;
  onUploaded: (destination: UploadDestination) => void;
}

type SuggestionState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "matched";
      motherFolderId: string;
      motherFolderName: string;
      childFolderId: string;
      childFolderName: string;
    }
  | {
      status: "unmatched";
      motherFolderName: string;
      childFolderName: string;
      color: string;
    };

export function DialogCategorizeImage({
  isOpen,
  onOpenChange,
  file,
  onUploaded,
}: DialogCategorizeImageProps) {
  const [suggestion, setSuggestion] = useState<SuggestionState>({
    status: "loading",
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestIdRef = useRef(0);
  const createdDestinationRef = useRef<UploadDestination | null>(null);
  const isSubmittingRef = useRef(false);

  const resolveSuggestion = useCallback(async () => {
    if (file === null) return;

    const requestId = ++requestIdRef.current;
    createdDestinationRef.current = null;
    setSuggestion({ status: "loading" });
    setSubmitError(null);

    try {
      const uploadFile = ensureUploadFilename(file.blob, file.contentType);
      const result = await suggestFolder(uploadFile, file.contentType);

      if (requestIdRef.current !== requestId) return;

      if (
        result.matched &&
        result.motherFolderId !== null &&
        result.childFolderId !== null
      ) {
        const [motherFolders, childFolders] = await Promise.all([
          listMotherFolders(),
          listChildFolders(result.motherFolderId),
        ]);

        if (requestIdRef.current !== requestId) return;

        setSuggestion({
          status: "matched",
          motherFolderId: result.motherFolderId,
          motherFolderName:
            motherFolders.find((item) => item.id === result.motherFolderId)
              ?.name ?? "Pasta",
          childFolderId: result.childFolderId,
          childFolderName:
            childFolders.find((item) => item.id === result.childFolderId)
              ?.name ?? "Assunto",
        });
        return;
      }

      setSuggestion({
        status: "unmatched",
        motherFolderName: result.suggestedMotherFolderName ?? "",
        childFolderName: result.suggestedChildFolderName ?? "",
        color: getRandomColor(),
      });
    } catch (error) {
      if (requestIdRef.current !== requestId) return;

      setSuggestion({
        status: "error",
        message:
          error instanceof ApiError
            ? error.detail
            : "Não foi possível analisar o material. Tente novamente.",
      });
    }
  }, [file]);

  useEffect(() => {
    if (isOpen && file !== null) resolveSuggestion();
  }, [isOpen, file, resolveSuggestion]);

  const isPdf = file?.contentType === "PDF";
  const isCategorizing = suggestion.status === "loading";
  const isValid =
    suggestion.status === "matched" ||
    (suggestion.status === "unmatched" &&
      suggestion.motherFolderName.trim().length >= 3 &&
      suggestion.childFolderName.trim().length >= 3);

  async function handleSubmit() {
    if (
      !isValid ||
      isSubmittingRef.current ||
      file === null ||
      (suggestion.status !== "matched" && suggestion.status !== "unmatched")
    ) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const uploadFile = ensureUploadFilename(file.blob, file.contentType);

      // Reaproveita a pasta já criada numa tentativa anterior (se o upload
      // falhou depois de criar a pasta) em vez de duplicar a cada retry.
      let destination = createdDestinationRef.current;

      if (destination === null) {
        destination =
          suggestion.status === "matched"
            ? {
                motherFolderId: suggestion.motherFolderId,
                childFolderId: suggestion.childFolderId,
              }
            : await (async () => {
                const motherFolder = await createOrReuseMotherFolder(
                  suggestion.motherFolderName.trim(),
                  suggestion.color,
                );
                const childFolder = await createOrReuseChildFolder(
                  motherFolder.id,
                  suggestion.childFolderName.trim(),
                );

                return {
                  motherFolderId: motherFolder.id,
                  childFolderId: childFolder.id,
                };
              })();

        createdDestinationRef.current = destination;
      }

      await uploadContent(destination.childFolderId, uploadFile, file.contentType);

      onOpenChange(false);
      onUploaded(destination);
    } catch (error) {
      setSubmitError(
        error instanceof ApiError
          ? error.detail
          : "Não foi possível enviar o material. Tente novamente.",
      );
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
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

            {suggestion.status === "loading" ? (
              <Modal.Body className="flex flex-col items-center gap-3 py-8 text-center">
                <Spinner size="lg" />
                <p className="text-muted text-sm">
                  O Revi IA está analisando {isPdf ? "este PDF" : "esta imagem"}{" "}
                  para sugerir onde guardar.
                </p>
              </Modal.Body>
            ) : suggestion.status === "error" ? (
              <Modal.Body>
                <p className="text-danger text-sm text-pretty">
                  {suggestion.message}
                </p>
              </Modal.Body>
            ) : suggestion.status === "matched" ? (
              <Modal.Body className="grid gap-2">
                <p className="text-muted text-sm">
                  Encontramos uma pasta correspondente para{" "}
                  {isPdf ? "o PDF" : "a imagem"}:
                </p>
                <p className="font-medium">
                  {suggestion.motherFolderName} / {suggestion.childFolderName}
                </p>
              </Modal.Body>
            ) : (
              <Modal.Body className="flex flex-col gap-4">
                <p className="text-muted text-sm">
                  Não encontramos uma pasta correspondente. Confira os nomes
                  sugeridos antes de criar.
                </p>

                <TextField className="w-full">
                  <Label htmlFor="nome-nova-pasta">Nome da pasta</Label>
                  <Input
                    id="nome-nova-pasta"
                    placeholder="Matemática, Português..."
                    value={suggestion.motherFolderName}
                    onChange={(event) =>
                      setSuggestion({
                        ...suggestion,
                        motherFolderName: event.target.value,
                      })
                    }
                  />
                </TextField>
                <ColorPicker
                  label="Cor da pasta"
                  value={suggestion.color}
                  onChange={(color) =>
                    setSuggestion({ ...suggestion, color })
                  }
                />
                <TextField className="w-full">
                  <Label htmlFor="nome-assunto-imagem">Assunto</Label>
                  <Input
                    id="nome-assunto-imagem"
                    placeholder="Equação de terceiro grau..."
                    value={suggestion.childFolderName}
                    onChange={(event) =>
                      setSuggestion({
                        ...suggestion,
                        childFolderName: event.target.value,
                      })
                    }
                  />
                </TextField>
              </Modal.Body>
            )}

            {submitError !== null ? (
              <Modal.Body className="pt-0">
                <p role="alert" className="text-danger text-sm text-pretty">
                  {submitError}
                </p>
              </Modal.Body>
            ) : null}

            <Modal.Footer>
              {suggestion.status === "error" ? (
                <Button
                  className="w-full"
                  variant="secondary"
                  onPress={resolveSuggestion}
                >
                  Tentar novamente
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onPress={handleSubmit}
                  isDisabled={isCategorizing || !isValid || isSubmitting}
                >
                  {isPdf ? "Salvar PDF" : "Salvar imagem"}
                </Button>
              )}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
