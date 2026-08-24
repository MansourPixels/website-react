import { Button, Spinner, cn } from "@heroui/react";
import { Camera, CameraOff, ImagePlus, X, Zap, ZapOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { NavMenu } from "./NavMenu";
import type { useCamera } from "../hooks/useCamera";

interface CaptureDeskProps {
  title?: string;
  camera: ReturnType<typeof useCamera>;
  onPickFile: () => void;
  onReceiveFile: (file: Blob) => void;
  onCapture: () => void;
  /**
   * Falso enquanto a revisão da foto ou o diálogo de categorização estiverem
   * abertos: sem isto, colar uma imagem por cima do fluxo já em andamento
   * trocaria a foto que o usuário está revisando, atrás do próprio diálogo.
   */
  isPasteEnabled: boolean;
}

/**
 * A superfície de captura para quem tem mouse.
 *
 * No celular a câmera é a porta do produto e ocupa a tela inteira. No desktop
 * essa mesma tela seria uma webcam frontal esticada em 1920px, apontada para um
 * caderno que ela não consegue ler. Então aqui o arquivo lidera: arrastar,
 * colar ou escolher; e a webcam fica ao lado, desligada até alguém pedir.
 */
export function CaptureDesk({
  title,
  camera,
  onPickFile,
  onReceiveFile,
  onCapture,
  isPasteEnabled,
}: CaptureDeskProps) {
  const {
    videoRef,
    status,
    error,
    isFlashSupported,
    isFlashOn,
    toggleFlash,
    start,
    stop,
    retry,
  } = camera;

  const [isDragging, setIsDragging] = useState(false);
  const dragDepth = useRef(0);

  // Ctrl+V com uma imagem na área de transferência: quem está no computador
  // acabou de recortar a foto em algum lugar, e essa é a rota mais curta.
  useEffect(() => {
    if (!isPasteEnabled) return;

    function handlePaste(event: ClipboardEvent) {
      const [file] = Array.from(event.clipboardData?.files ?? []).filter(
        (candidate) => candidate.type.startsWith("image/"),
      );

      if (file) {
        event.preventDefault();
        onReceiveFile(file);
      }
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [onReceiveFile, isPasteEnabled]);

  function handleDragEnter(event: React.DragEvent) {
    event.preventDefault();
    dragDepth.current += 1;
    setIsDragging(true);
  }

  function handleDragLeave(event: React.DragEvent) {
    event.preventDefault();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setIsDragging(false);
    }
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);

    const [file] = Array.from(event.dataTransfer.files).filter((candidate) =>
      candidate.type.startsWith("image/"),
    );

    if (file) onReceiveFile(file);
  }

  return (
    <main className="p-6 md:p-8 gap-8 flex flex-col w-full max-w-6xl mx-auto">
      <NavMenu title={title ?? "Nova captura"} hasBackButton={Boolean(title)} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <section className="bg-white rounded-3xl shadow-surface p-4 md:p-6">
          <button
            type="button"
            onClick={onPickFile}
            onDragEnter={handleDragEnter}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            aria-label="Escolher uma imagem do seu material para enviar"
            className={cn(
              "w-full min-h-80 px-6 py-12 rounded-2xl border-2 border-dashed",
              "flex flex-col items-center justify-center gap-5 text-center",
              "transition-colors cursor-pointer",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              isDragging
                ? "border-accent bg-accent-soft"
                : "border-border hover:bg-background",
            )}
          >
            <span
              className={cn(
                "size-16 rounded-full flex items-center justify-center transition-colors",
                isDragging
                  ? "bg-accent text-accent-foreground"
                  : "bg-accent-soft text-accent",
              )}
            >
              <ImagePlus className="size-7" />
            </span>

            <span className="flex flex-col gap-1">
              <span className="text-2xl font-semibold text-balance">
                {isDragging
                  ? "Solte para enviar"
                  : "Arraste uma foto do seu material"}
              </span>
              <span className="text-sm text-muted text-balance">
                Caderno, lousa ou apostila. Você também pode colar com Ctrl+V.
              </span>
            </span>

            <span className="h-10 px-4 rounded-3xl bg-accent text-accent-foreground text-sm font-medium inline-flex items-center justify-center">
              Escolher arquivo
            </span>
          </button>
        </section>

        <section className="bg-white rounded-3xl shadow-surface p-4 md:p-6 flex flex-col gap-4">
          <header className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">Usar a webcam</h2>
            <p className="text-sm text-muted text-balance">
              Aponte a câmera para o material e capture a imagem.
            </p>
          </header>

          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-background flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              aria-label="Visualização da webcam"
              className={cn(
                "size-full object-cover transition-opacity",
                status === "ready" ? "opacity-100" : "opacity-0",
              )}
            />

            {status === "idle" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <Camera className="size-8 text-muted" />
                <p className="text-sm text-muted text-balance">
                  A webcam permanece desligada até você ligar.
                </p>
              </div>
            ) : null}

            {status === "loading" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <Spinner size="lg" />
                <p className="text-sm text-muted">Iniciando câmera...</p>
              </div>
            ) : null}

            {status === "error" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <CameraOff className="size-8 text-danger" />
                <p className="text-sm text-muted text-balance">{error}</p>
              </div>
            ) : null}
          </div>

          {status === "ready" ? (
            <div className="flex items-center gap-2">
              <Button className="flex-1" onPress={onCapture}>
                <Camera />
                Capturar foto
              </Button>

              {isFlashSupported ? (
                <Button
                  isIconOnly
                  variant="tertiary"
                  aria-label={isFlashOn ? "Desligar flash" : "Ligar flash"}
                  onPress={toggleFlash}
                >
                  {isFlashOn ? <Zap /> : <ZapOff />}
                </Button>
              ) : null}

              <Button
                isIconOnly
                variant="tertiary"
                aria-label="Desligar a webcam"
                onPress={stop}
              >
                <X />
              </Button>
            </div>
          ) : (
            <Button
              variant="tertiary"
              fullWidth
              isDisabled={status === "loading"}
              onPress={status === "error" ? retry : start}
            >
              <Camera />
              {status === "error" ? "Tentar novamente" : "Ligar a webcam"}
            </Button>
          )}
        </section>
      </div>
    </main>
  );
}
