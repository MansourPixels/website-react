import { ApiError } from "@/api/client";
import { importFromDrive } from "@/api/content";
import { useGoogle } from "@/contexts/GoogleContext";
import type { CapturedFile } from "@/types/capture";
import type { DriveFileRef } from "@/types/Google";
import { DRIVE_SCOPE, GoogleError, hasScope } from "@/utils/googleAuth";
import { googleIssueMessage } from "@/utils/googleIssues";
import { openDrivePicker } from "@/utils/googlePicker";
import { readGoogleToken } from "@/utils/googleStorage";
import {
  ACCEPTED_MATERIAL_TYPES,
  contentTypeOf,
  isAcceptedMaterial,
} from "@/utils/materials";
import { Button, cn, Spinner } from "@heroui/react";
import {
  CameraOff,
  FileText,
  HardDriveDownload,
  Images,
  Zap,
  ZapOff,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useFeedback } from "../hooks/useFeedback";
import { useCamera } from "../hooks/useCamera";
import { useTouchPrimary } from "../hooks/useMediaQuery";
import { useTapToFocus } from "../hooks/useTapToFocus";
import { CameraFocusOverlay } from "./CameraFocusOverlay";
import { CaptureDesk } from "./CaptureDesk";
import {
  DialogCategorizeImage,
  type UploadDestination,
} from "./DialogCategorizeImage";
import { DialogImportFromDrive } from "./DialogImportFromDrive";
import { NavMenu } from "./NavMenu";
import { PhotoReview } from "./PhotoReview";

const DRIVE_GENERIC_ERROR =
  "Não foi possível trazer o arquivo do Google Drive. Tente de novo.";

interface CameraProps {
  title?: string;
  footerClass?: string;
  onSelectMaterial?: (file: CapturedFile) => Promise<void>;
  /**
   * Destino já decidido para o material vindo do Drive — a câmera do assunto
   * sabe em qual assunto está. Sem ele, o diálogo pergunta onde guardar.
   */
  driveChildFolderId?: string;
  /** Chamado depois de o servidor confirmar a importação do Drive. */
  onDriveImported?: () => void;
}

export function Camera({
  title,
  footerClass,
  onSelectMaterial,
  driveChildFolderId,
  onDriveImported,
}: CameraProps) {
  const isTouchPrimary = useTouchPrimary();

  const camera = useCamera({ autoStart: isTouchPrimary });
  const {
    videoRef,
    status,
    error,
    errorKind,
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
  const feedback = useFeedback();
  const google = useGoogle();

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
  const [isImportingDrive, setIsImportingDrive] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  // O arquivo escolhido no Picker, esperando o destino. Só id, nome e tipo — os
  // bytes ficam no Google e vão direto de lá para o servidor.
  const [driveFile, setDriveFile] = useState<DriveFileRef | null>(null);

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
        // A referência continua apontando para a URL: a miniatura da galeria
        // ainda a exibe, e é ela que garante o revoke na desmontagem ou na
        // próxima captura. Zerá-la aqui vazava um blob por envio.
        setReviewMaterial(null);
      } catch (error) {
        feedback("erro");
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

    if (photo === null) {
      feedback("erro");
      return;
    }

    feedback("camera-obturador");
    showPreview(photo);
  }

  function handleSelectFile(event: React.ChangeEvent<HTMLInputElement>) {
    const [file] = event.target.files ?? [];

    if (file !== undefined) {
      if (isAcceptedMaterial(file)) showPreview(file);
      else feedback("erro");
    }

    event.target.value = "";
  }

  /**
   * Um gesto, duas etapas: sem token válido o mesmo clique pede o
   * consentimento e só então abre o Picker — nenhuma tela intermediária. O
   * consentimento precisa nascer *dentro* do clique, ou o pop-up é bloqueado.
   *
   * Do Picker em diante quem trabalha é o servidor: ele baixa os bytes direto
   * do Drive, e eles nunca passam por este aparelho. É por isso que o caminho
   * do Drive não tem PhotoReview nem sugestão da Revi IA — sem os bytes aqui
   * não há o que pré-visualizar nem o que mandar para o `folder-suggestion`.
   */
  async function handleImportFromDrive() {
    if (isImportingDrive) return;

    setDriveError(null);
    setIsImportingDrive(true);

    try {
      // Sem conexão anterior vamos direto ao consentimento: esperar por uma
      // renovação silenciosa que não tem como dar certo gastaria a janela de
      // ativação do clique, e aí o pop-up seria bloqueado.
      const stored = readGoogleToken();
      let token = stored === null ? null : await google.ensureToken();

      // Escopo lido do token guardado, não do estado do contexto: logo depois
      // de conectar o estado ainda não chegou neste closure.
      if (
        token === null ||
        !hasScope(readGoogleToken()?.scope ?? "", DRIVE_SCOPE)
      ) {
        if (!(await google.connect())) return;

        token = await google.ensureToken();

        if (token === null) return;

        if (!hasScope(readGoogleToken()?.scope ?? "", DRIVE_SCOPE)) {
          setDriveError(googleIssueMessage("scopeMissing"));

          return;
        }
      }

      const reference = await openDrivePicker(token);

      // Fechar o Picker sem escolher nada não é erro.
      if (reference === null) return;

      // A câmera do assunto já sabe o destino: perguntar "onde guardar?" dentro
      // do próprio assunto seria uma pergunta já respondida.
      if (driveChildFolderId !== undefined) {
        await importFromDrive(reference.id, driveChildFolderId);
        feedback("sucesso");
        onDriveImported?.();

        return;
      }

      setDriveFile(reference);
    } catch (importError) {
      feedback("erro");
      setDriveError(
        importError instanceof ApiError
          ? importError.detail
          : importError instanceof GoogleError
            ? (googleIssueMessage(importError.issue) ?? DRIVE_GENERIC_ERROR)
            : DRIVE_GENERIC_ERROR,
      );
    } finally {
      setIsImportingDrive(false);
    }
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

      <DialogImportFromDrive
        isOpen={driveFile !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDriveFile(null);
        }}
        file={driveFile}
        onImported={(destination) => {
          setDriveFile(null);
          feedback("sucesso");
          handleUploaded(destination);
        }}
      />
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
          isDriveAvailable={google.isDriveConfigured}
          isImportingDrive={isImportingDrive}
          driveError={driveError}
          onImportFromDrive={() => void handleImportFromDrive()}
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
        <div className="absolute p-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
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
        <div
          role="alert"
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-10 text-center text-white"
        >
          <CameraOff className="size-10 opacity-75" />
          <p className="text-sm opacity-75">{error}</p>
          {/* Com a permissão bloqueada o navegador rejeita a próxima chamada
              sem perguntar de novo, então "Tentar novamente" seria um botão
              inerte: o caminho que ainda funciona é escolher do dispositivo. */}
          {errorKind === "NotAllowedError" ? (
            <Button
              variant="secondary"
              onPress={() => fileInputRef.current?.click()}
            >
              Escolher imagem ou PDF
            </Button>
          ) : (
            <Button variant="secondary" onPress={retry}>
              Tentar novamente
            </Button>
          )}
        </div>
      ) : null}

      <footer
        className={cn(
          "px-6 py-8 short:py-4 flex flex-col gap-4 fixed bottom-0 inset-x-0",
          "pb-[max(2rem,env(safe-area-inset-bottom))] short:pb-[max(1rem,env(safe-area-inset-bottom))]",
          footerClass,
        )}
      >
        {/* Fora da fileira do obturador de propósito: o vão entre galeria e
            flash é o que mantém o obturador centralizado. */}
        {google.isDriveConfigured ? (
          <div className="flex flex-col items-center gap-2">
            {driveError !== null ? (
              <p
                role="alert"
                className="max-w-80 rounded-2xl bg-black/50 px-4 py-2 text-center text-sm text-white text-pretty"
              >
                {driveError}
              </p>
            ) : null}

            <Button
              className="h-10 px-4 rounded-full bg-black/35 text-white"
              isPending={isImportingDrive}
              onPress={() => void handleImportFromDrive()}
            >
              <HardDriveDownload className="size-4" />
              Importar do Google Drive
            </Button>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4">
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
              // `bg-white`/`text-zinc-900` literais: ícone de documento sobre o
              // visor da câmera, que é sempre escuro — não segue o tema. Antes do
              // modo escuro `text-foreground` também era sempre escuro; agora
              // precisa ficar fixo, ou o ícone sumiria (claro sobre claro) com o
              // tema escuro ativo.
              <span className="size-full flex items-center justify-center bg-white text-zinc-900">
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

          {/* Aparelho sem lanterna esconde o controle, como já faz a mesa de
            captura no desktop — um botão desabilitado sem explicação só
            levanta a pergunta. O vão preserva o obturador centralizado. */}
          {isFlashSupported ? (
            <Button
              id="flash"
              isIconOnly
              size="lg"
              aria-label={isFlashOn ? "Desligar flash" : "Ligar flash"}
              className={isFlashOn ? "bg-amber-500" : "bg-black/35"}
              onPress={toggleFlash}
            >
              {isFlashOn ? <Zap /> : <ZapOff />}
            </Button>
          ) : (
            <span className="size-13" aria-hidden="true" />
          )}
        </div>
      </footer>

      {overlays}
    </div>
  );
}
