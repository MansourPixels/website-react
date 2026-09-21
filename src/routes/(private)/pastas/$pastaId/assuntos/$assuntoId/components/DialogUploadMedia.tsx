import { Button, Modal } from "@heroui/react";
import { AudioLines, FileUp, Video } from "lucide-react";
import { useRef, useState } from "react";

import { ApiError } from "@/api/client";
import { uploadMedia } from "@/api/media";
import { useFeedback } from "@/hooks/useFeedback";
import type { Content } from "@/types/api/content";
import {
  MAX_AUDIO_BYTES,
  MAX_VIDEO_BYTES,
  MEDIA_ACCEPT,
  formatFileSize,
  isAudioFile,
  isVideoFile,
  mediaProblem,
} from "@/utils/materials";

interface DialogUploadMediaProps {
  childFolderId: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUploaded: (content: Content) => void;
}

const NETWORK_ERROR =
  "O envio foi interrompido. Confira a conexão e o tamanho do arquivo (o limite é de " +
  formatFileSize(MAX_AUDIO_BYTES) +
  " para áudio e " +
  formatFileSize(MAX_VIDEO_BYTES) +
  " para vídeo) e tente de novo.";

/**
 * Envia um áudio ou um vídeo direto para um assunto. Não passa pela captura: a
 * captura lê o material (OCR) para sugerir uma pasta, e uma mídia não tem
 * imagem para ler nem pasta a sugerir, porque o assunto já está escolhido. Um
 * vídeo é transcrito pela faixa de áudio; o arquivo original fica para assistir.
 *
 * O tamanho e a extensão são conferidos aqui antes de qualquer envio: um
 * arquivo muito acima do limite não recebe `413` do servidor (a conexão é
 * fechada no meio do envio e o navegador só vê um erro de rede).
 */
export function DialogUploadMedia({
  childFolderId,
  isOpen,
  onOpenChange,
  onUploaded,
}: DialogUploadMediaProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const feedback = useFeedback();

  const isSending = progress !== null;
  const problem = file === null ? null : mediaProblem(file);
  const detected = file === null ? null : isVideoFile(file) ? "vídeo" : isAudioFile(file) ? "áudio" : null;

  // Fechar o diálogo durante o envio o cancela (não fica upload órfão) e
  // limpa o formulário para a próxima vez.
  function handleOpenChange(open: boolean) {
    if (!open) {
      controllerRef.current?.abort();
      controllerRef.current = null;
      setFile(null);
      setError(null);
      setProgress(null);
    }

    onOpenChange(open);
  }

  async function handleUpload() {
    if (file === null || problem !== null || isSending) return;

    const controller = new AbortController();

    controllerRef.current = controller;
    setError(null);
    setProgress(0);

    try {
      const created = await uploadMedia(childFolderId, file, {
        signal: controller.signal,
        onProgress: setProgress,
      });

      feedback("sucesso");
      onUploaded(created);
      handleOpenChange(false);
    } catch (reason) {
      if (controller.signal.aborted) return;

      feedback("erro");
      setError(reason instanceof ApiError ? reason.detail : NETWORK_ERROR);
      setProgress(null);
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }

  const percent = Math.round((progress ?? 0) * 100);

  return (
    <Modal isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-100">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="bg-default text-foreground">
                {detected === "vídeo" ? (
                  <Video className="size-5" />
                ) : (
                  <AudioLines className="size-5" />
                )}
              </Modal.Icon>
              <Modal.Heading>Enviar áudio ou vídeo</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              <input
                ref={inputRef}
                type="file"
                accept={MEDIA_ACCEPT}
                className="sr-only"
                aria-label="Arquivo de áudio ou vídeo"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  setError(null);
                  event.target.value = "";
                }}
              />
              <Button
                variant="secondary"
                className="min-h-11 w-full"
                isDisabled={isSending}
                onPress={() => inputRef.current?.click()}
              >
                <FileUp className="size-4" />
                {file === null ? "Escolher arquivo" : "Trocar arquivo"}
              </Button>

              <p className="text-muted text-xs text-pretty">
                {file === null
                  ? `Áudio (MP3, M4A, WAV, OGG ou FLAC) até ${formatFileSize(MAX_AUDIO_BYTES)}, ou vídeo (MP4, MOV, MKV ou WEBM) até ${formatFileSize(MAX_VIDEO_BYTES)}. A transcrição, o resumo e os momentos-chave ficam prontos em alguns minutos.`
                  : `${file.name}${detected === null ? "" : `: ${detected}`}, ${formatFileSize(file.size)}`}
              </p>

              {problem !== null ? (
                <p role="alert" className="text-danger text-sm text-pretty">
                  {problem}
                </p>
              ) : null}
              {error !== null ? (
                <p role="alert" className="text-danger text-sm text-pretty">
                  {error}
                </p>
              ) : null}

              {isSending ? (
                <div className="flex flex-col gap-1">
                  <div
                    role="progressbar"
                    aria-label="Progresso do envio"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percent}
                    className="bg-default h-2 w-full overflow-hidden rounded-full"
                  >
                    <div
                      className="bg-accent h-full transition-[width]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p role="status" className="text-muted text-xs tabular-nums">
                    {percent < 100
                      ? `Enviando… ${percent}%`
                      : "Enviado. Guardando o arquivo…"}
                  </p>
                </div>
              ) : null}

              <Button
                className="min-h-11 w-full"
                isDisabled={file === null || problem !== null || isSending}
                onPress={() => void handleUpload()}
              >
                {isSending ? "Enviando…" : detected === null ? "Enviar" : `Enviar ${detected}`}
              </Button>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
