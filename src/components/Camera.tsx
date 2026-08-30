import { ApiError } from "@/api/client";
import type { CapturedFile } from "@/types/capture";
import {
  ACCEPTED_MATERIAL_TYPES,
  contentTypeOf,
  isAcceptedMaterial,
} from "@/utils/materials";
import { Button, cn, Spinner } from "@heroui/react";
import { CameraOff, FileText, Images, Zap, ZapOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useCamera } from "../hooks/useCamera";
import { useTouchPrimary } from "../hooks/useMediaQuery";
import { useTapToFocus } from "../hooks/useTapToFocus";
import { CameraFocusOverlay } from "./CameraFocusOverlay";
import { CaptureDesk } from "./CaptureDesk";
import {
  DialogCategorizeImage,
  type UploadDestination,
} from "./DialogCategorizeImage";
import { NavMenu } from "./NavMenu";
import { PhotoReview } from "./PhotoReview";

interface CameraProps {
  title?: string;
  footerClass?: string;
  onSelectMaterial?: (file: CapturedFile) => Promise<void>;
}

export function Camera({ title, footerClass, onSelectMaterial }: CameraProps) {
  const isTouchPrimary = useTouchPrimary();

  const camera = useCamera({ autoStart: isTouchPrimary });
  const {
    videoRef,
    status,
    error,
    isFlashSupported,
    isFlashOn,
    isTapFocusSupported,
    exposureRange,
    exposureBaseline,
    toggleFlash,
    focusAt,
    setExposureCompensation,
    capturePhoto,
    retry,
  } = camera;

  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<CapturedFile | null>(null);
  const [reviewMaterial, setReviewMaterial] = useState<CapturedFile | null>(
    null,
  );
  const [isCategorizeOpen, setIsCategorizeOpen] = useState(false);
  const [isSubmittingMaterial, setIsSubmittingMaterial] = useState(false);
  const [submitMaterialError, setSubmitMaterialError] = useState<
    string | null
  >(null);

  const isFocusEnabled =
    isTouchPrimary &&
    isTapFocusSupported &&
    status === "ready" &&
    !reviewMaterial &&
    !isCategorizeOpen;

  const { indicator, handlers: focusHandlers } = useTapToFocus({
    videoRef,
    isEnabled: isFocusEnabled,
    exposureRange,
    exposureBaseline,
    focusAt,
    setExposureCompensation,
  });

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const showPreview = useCallback((file: Blob) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);

    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;

    const captured: CapturedFile = {
      blob: file,
      url,
      contentType: contentTypeOf(file),
      name: file instanceof File ? file.name : "Captura da câmera",
    };

    setPreview(captured);
    setReviewMaterial(captured);
  }, []);

  async function handleSelectMaterial() {
    if (!reviewMaterial) return;

    if (onSelectMaterial) {
      setIsSubmittingMaterial(true);
      setSubmitMaterialError(null);

      try {
        await onSelectMaterial(reviewMaterial);
        previewUrlRef.current = null;
        setReviewMaterial(null);
      } catch (error) {
        setSubmitMaterialError(
          error instanceof ApiError
            ? error.detail
            : "Não foi possível enviar o material. Tente novamente.",
        );
      } finally {
        setIsSubmittingMaterial(false);
      }
      return;
    }

    setIsCategorizeOpen(true);
  }

  function handleUploaded({ motherFolderId, childFolderId }: UploadDestination) {
    setReviewMaterial(null);
    navigate(`/pastas/${motherFolderId}/assuntos/${childFolderId}`);
  }

  async function handleCapture() {
    const photo = await capturePhoto();
    if (photo) showPreview(photo);
  }

  function handleSelectFile(event: React.ChangeEvent<HTMLInputElement>) {
    const [file] = event.target.files ?? [];
    if (file && isAcceptedMaterial(file)) showPreview(file);

    event.target.value = "";
  }

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept={ACCEPTED_MATERIAL_TYPES}
      className="hidden"
      onChange={handleSelectFile}
    />
  );

  const overlays = (
    <>
      {reviewMaterial ? (
        <PhotoReview
          material={reviewMaterial}
          onBack={() => setReviewMaterial(null)}
          onSelect={handleSelectMaterial}
          isSubmitting={isSubmittingMaterial}
          error={submitMaterialError}
        />
      ) : null}

      {!onSelectMaterial ? (
        <DialogCategorizeImage
          isOpen={isCategorizeOpen}
          onOpenChange={setIsCategorizeOpen}
          file={reviewMaterial}
          onUploaded={handleUploaded}
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
          isPasteEnabled={!reviewMaterial && !isCategorizeOpen}
        />
        {overlays}
      </>
    );
  }

  return (
    <div
      className={cn(
        "fixed inset-0 bg-black overflow-hidden",
        reviewMaterial && "z-50",
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
        draggable={false}
        aria-label={
          isFocusEnabled
            ? "Visualização da câmera. Toque para focar e arraste para cima ou para baixo para ajustar a exposição."
            : "Visualização da câmera"
        }
        className={cn(
          "size-full object-cover transition-opacity",
          // O arrasto vertical precisa chegar até aqui: sem `touch-none` o
          // compositor do Chrome Android o converte em scroll e mata o gesto
          // com um `pointercancel` no meio.
          "touch-none overscroll-none select-none [-webkit-touch-callout:none] [-webkit-tap-highlight-color:transparent]",
          status === "ready" ? "opacity-100" : "opacity-0",
        )}
        {...focusHandlers}
      />

      <CameraFocusOverlay
        indicator={indicator}
        hasExposureControl={Boolean(exposureRange)}
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
          aria-label="Escolher imagem ou PDF do dispositivo"
          className="size-13 rounded-lg p-0 overflow-hidden bg-black/35 text-white"
          onPress={() => fileInputRef.current?.click()}
        >
          {preview === null ? (
            <Images />
          ) : preview.contentType === "PDF" ? (
            <span className="size-full flex items-center justify-center bg-white text-foreground">
              <FileText className="size-6" />
              <span className="sr-only">Último PDF selecionado</span>
            </span>
          ) : (
            <img
              id="galeria-thumb"
              src={preview.url}
              alt="Última imagem selecionada"
              className="size-full object-cover"
            />
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
