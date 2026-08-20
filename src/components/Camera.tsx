import { Button, cn, Spinner } from "@heroui/react";
import { CameraOff, Images, Zap, ZapOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCamera } from "../hooks/useCamera";
import { NavMenu } from "./NavMenu";

interface CameraProps {
  title?: string;
  footerClass?: string;
}

export function Camera({ title, footerClass }: CameraProps) {
  const {
    videoRef,
    status,
    error,
    isFlashSupported,
    isFlashOn,
    toggleFlash,
    capturePhoto,
    retry,
  } = useCamera();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function showPreview(blob: Blob) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);

    const url = URL.createObjectURL(blob);
    previewUrlRef.current = url;
    setPreview(url);
  }

  async function handleCapture() {
    const photo = await capturePhoto();
    if (photo) showPreview(photo);
  }

  function handleSelectFile(event: React.ChangeEvent<HTMLInputElement>) {
    const [file] = event.target.files ?? [];
    if (file) showPreview(file);

    event.target.value = "";
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {title ? (
        <div className="absolute p-6">
          <NavMenu title={title} hasBackButton variant="white" />
        </div>
      ) : null}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        aria-label="Visualização da câmera"
        className={cn("size-full object-cover transition-opacity", status === "ready" ? "opacity-100" : "opacity-0")}
      />

      {status === "loading" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
          <Spinner size="lg" color="current" />
          <p className="text-sm opacity-75">Iniciando câmera...</p>
        </div>
      ) : null}

      {status === "error" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-10 text-center text-white">
          <CameraOff className="size-10 opacity-75" />
          <p className="text-sm opacity-75">{error}</p>
          <Button variant="secondary" onPress={retry}>
            Tentar novamente
          </Button>
        </div>
      ) : null}

      <footer
        className={cn(
          "p-10 flex items-center justify-between fixed bottom-0 inset-x-0",
          footerClass,
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleSelectFile}
        />
        <Button
          id="galeria"
          aria-label="Escolher imagem da galeria"
          className="size-13 rounded-lg p-0 overflow-hidden bg-black/35"
          onPress={() => fileInputRef.current?.click()}
        >
          {preview ? (
            <img
              id="galeria-thumb"
              src={preview}
              alt="Última imagem selecionada"
              className="size-full object-cover"
            />
          ) : (
            <Images />
          )}
        </Button>

        <Button
          id="capturar"
          isIconOnly
          aria-label="Capturar foto"
          isDisabled={status !== "ready"}
          className="size-17 rounded-full border-4 border-white bg-black/50 p-1"
          onPress={handleCapture}
        >
          <span className="size-full rounded-full border-2 border-amber-500" />
        </Button>

        <Button
          id="flash"
          isIconOnly
          aria-label={isFlashOn ? "Desligar flash" : "Ligar flash"}
          isDisabled={!isFlashSupported}
          className={isFlashOn ? "bg-amber-500" : "bg-black/35"}
          onPress={toggleFlash}
        >
          {isFlashOn ? <Zap /> : <ZapOff />}
        </Button>
      </footer>
    </div>
  );
}
