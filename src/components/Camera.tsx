import { Button, cn, Spinner } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { CameraOff, Images, Zap, ZapOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCamera } from "../hooks/useCamera";
import { useTouchPrimary } from "../hooks/useMediaQuery";
import { defaultFolders } from "../mocks/folders";
import { CaptureDesk } from "./CaptureDesk";
import {
  DialogCategorizeImage,
  type ImageCategorization,
} from "./DialogCategorizeImage";
import { NavMenu } from "./NavMenu";
import { PhotoReview } from "./PhotoReview";

interface CameraProps {
  title?: string;
  footerClass?: string;
  onSelectImage?: (image: string) => void;
}

export function Camera({ title, footerClass, onSelectImage }: CameraProps) {
  const isTouchPrimary = useTouchPrimary();

  const camera = useCamera({ autoStart: isTouchPrimary });
  const {
    videoRef,
    status,
    error,
    isFlashSupported,
    isFlashOn,
    toggleFlash,
    capturePhoto,
    retry,
  } = camera;

  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [reviewImage, setReviewImage] = useState<string | null>(null);
  const [isCategorizeOpen, setIsCategorizeOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const showPreview = useCallback((blob: Blob) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);

    const url = URL.createObjectURL(blob);
    previewUrlRef.current = url;
    setPreview(url);
    setReviewImage(url);
  }, []);

  function handleSelectImage() {
    if (!reviewImage) return;

    if (onSelectImage) {
      onSelectImage(reviewImage);
      setReviewImage(null);
      return;
    }

    setIsCategorizeOpen(true);
  }

  function handleCategorize({ folder, subjectName }: ImageCategorization) {
    setReviewImage(null);

    navigate({
      to: "/pastas/$pastaId/assuntos/$assuntoId",
      params: { pastaId: folder.id, assuntoId: subjectName },
    });
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

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={handleSelectFile}
    />
  );

  const overlays = (
    <>
      {reviewImage ? (
        <PhotoReview
          image={reviewImage}
          onBack={() => setReviewImage(null)}
          onSelect={handleSelectImage}
        />
      ) : null}

      {!onSelectImage ? (
        <DialogCategorizeImage
          isOpen={isCategorizeOpen}
          onOpenChange={setIsCategorizeOpen}
          folders={defaultFolders}
          onSubmit={handleCategorize}
        />
      ) : null}
    </>
  );

  if (!isTouchPrimary) {
    return (
      <>
        {fileInput}
        <CaptureDesk
          title={title}
          camera={camera}
          onPickFile={() => fileInputRef.current?.click()}
          onReceiveFile={showPreview}
          onCapture={handleCapture}
          isPasteEnabled={!reviewImage && !isCategorizeOpen}
        />
        {overlays}
      </>
    );
  }

  return (
    <div
      className={cn(
        "fixed inset-0 bg-black overflow-hidden",
        reviewImage && "z-50",
      )}
    >
      {title ? (
        <div className="absolute p-6">
          <NavMenu title={title} hasBackButton variant="white" />
        </div>
      ) : (
        <h1 className="sr-only">Nova captura</h1>
      )}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        aria-label="Visualização da câmera"
        className={cn(
          "size-full object-cover transition-opacity",
          status === "ready" ? "opacity-100" : "opacity-0",
        )}
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
          "px-6 py-8 short:py-4 flex items-center justify-between gap-4 fixed bottom-0 inset-x-0",
          "pb-[max(2rem,env(safe-area-inset-bottom))] short:pb-[max(1rem,env(safe-area-inset-bottom))]",
          footerClass,
        )}
      >
        {fileInput}
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

      {overlays}
    </div>
  );
}
