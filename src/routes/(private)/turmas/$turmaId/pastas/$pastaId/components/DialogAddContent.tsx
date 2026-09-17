import { Button, Modal, Spinner, Tabs } from "@heroui/react";
import { Copy, FileUp, Link2, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  createClassroomMaterialSnapshot,
  createClassroomReference,
  listReviMaterials,
  uploadClassroomContent,
} from "@/api/classrooms";
import { ApiError } from "@/api/client";
import { useFeedback } from "@/hooks/useFeedback";
import type { ClassroomContent, ClassroomReferenceKind, OwnerMaterial } from "@/types/api/classroom";

const MAX_FILE_SIZE = 20 * 1_048_576;
const kindLabels: Record<ClassroomReferenceKind, string> = {
  flashcards: "Flash cards",
  summary: "Resumo",
  quiz: "Simulado",
  mindmap: "Mapa mental",
};

interface DialogAddContentProps {
  classroomId: string;
  folderId: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (contents: ClassroomContent[]) => void;
}

export function DialogAddContent({ classroomId, folderId, isOpen, onOpenChange, onSubmit }: DialogAddContentProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [materials, setMaterials] = useState<OwnerMaterial[] | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sourceFolderId, setSourceFolderId] = useState("");
  const [referenceKind, setReferenceKind] = useState<ClassroomReferenceKind | "">("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const feedback = useFeedback();

  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    setError(null); setCatalogError(null); setFile(null); setTitle(""); setDescription(""); setSourceFolderId(""); setReferenceKind(""); setMaterials(null);
    listReviMaterials(controller.signal)
      .then((result) => { if (!controller.signal.aborted) setMaterials(result); })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setCatalogError(reason instanceof ApiError ? reason.detail : "Não foi possível carregar suas pastas pessoais.");
      });
    return () => controller.abort();
  }, [isOpen]);

  const selectedMaterial = materials?.find((item) => item.childFolderId === sourceFolderId);

  async function submit(action: () => Promise<ClassroomContent>, fallback: string) {
    if (isSubmitting) return;
    setIsSubmitting(true); setError(null);
    try {
      const created = await action();
      feedback("sucesso"); onSubmit([created]); onOpenChange(false);
    } catch (reason) {
      feedback("erro");
      setError(reason instanceof ApiError ? reason.status === 409 ? "Esta pasta ainda não possui material gerado para copiar." : reason.detail : fallback);
    } finally { setIsSubmitting(false); }
  }

  function handleUpload() {
    if (file === null) return;
    if (file.size > MAX_FILE_SIZE) { setError("O arquivo passa de 20 MB. Envie uma versão menor."); return; }
    void submit(() => uploadClassroomContent(classroomId, folderId, { file, title: title.trim() || file.name.replace(/\.[^.]+$/, ""), description: description.trim() || undefined }), "Não foi possível enviar o arquivo. Tente novamente.");
  }

  function renderMetadata() {
    return <><label className="grid gap-1 text-sm">Título<input className="border-separator rounded-lg border px-3 py-2" value={title} onChange={(event) => setTitle(event.target.value)} /></label><label className="grid gap-1 text-sm">Descrição (opcional)<input className="border-separator rounded-lg border px-3 py-2" value={description} onChange={(event) => setDescription(event.target.value)} /></label></>;
  }

  function renderFolderSelect(label: string) {
    return <label className="grid gap-1 text-sm">{label}<select className="border-separator rounded-lg border bg-surface px-3 py-2" value={sourceFolderId} onChange={(event) => { setSourceFolderId(event.target.value); setReferenceKind(""); }} disabled={materials === null || materials.length === 0}><option value="">Selecione uma pasta</option>{materials?.map((item) => <option key={item.childFolderId} value={item.childFolderId}>Pasta {item.childFolderId}</option>)}</select></label>;
  }

  return <Modal isOpen={isOpen} onOpenChange={onOpenChange}><Modal.Backdrop><Modal.Container><Modal.Dialog className="sm:max-w-100"><Modal.CloseTrigger /><Modal.Header><Modal.Icon className="bg-default text-foreground"><Plus className="size-5" /></Modal.Icon><Modal.Heading>Adicionar conteúdo</Modal.Heading></Modal.Header><Modal.Body className="flex flex-col gap-4"><Tabs defaultSelectedKey="arquivo"><Tabs.ListContainer><Tabs.List aria-label="Origem do conteúdo"><Tabs.Tab id="arquivo">Enviar arquivo<Tabs.Indicator /></Tabs.Tab><Tabs.Tab id="referencia">Referência<Tabs.Indicator /></Tabs.Tab><Tabs.Tab id="copia">Cópia da minha pasta<Tabs.Indicator /></Tabs.Tab></Tabs.List></Tabs.ListContainer>
    <Tabs.Panel id="arquivo" className="flex flex-col gap-4 pt-4"><input ref={fileInputRef} type="file" accept=".pdf,image/*" className="sr-only" onChange={(event) => { const nextFile = event.target.files?.[0] ?? null; setFile(nextFile); if (nextFile !== null && title.length === 0) setTitle(nextFile.name.replace(/\.[^.]+$/, "")); setError(null); }} /><Button variant="secondary" className="w-full" onPress={() => fileInputRef.current?.click()}><FileUp className="size-4" />{file === null ? "Escolher arquivo" : "Trocar arquivo"}</Button><p className="text-muted text-xs text-pretty">{file === null ? "Aceita PDF e imagens, até 20 MB." : file.name}</p>{renderMetadata()}<Button className="w-full" isDisabled={file === null || isSubmitting} onPress={handleUpload}>{isSubmitting ? "Enviando…" : "Enviar para a pasta"}</Button></Tabs.Panel>
    <Tabs.Panel id="referencia" className="flex flex-col gap-4 pt-4"><p className="text-muted text-sm">Uma referência registra o compartilhamento. Ela não cria uma cópia legível nesta turma.</p>{renderFolderSelect("Pasta pessoal")} {selectedMaterial ? <fieldset className="grid gap-2"><legend className="text-sm">Material disponível</legend><div className="flex flex-wrap gap-2">{selectedMaterial.kinds.map((kind) => <Button key={kind} size="sm" variant={referenceKind === kind ? "primary" : "secondary"} aria-pressed={referenceKind === kind} onPress={() => setReferenceKind(kind)}>{kindLabels[kind]}</Button>)}</div></fieldset> : null}{renderMetadata()}<Button className="w-full" isDisabled={!sourceFolderId || !referenceKind || !title.trim() || isSubmitting} onPress={() => void submit(() => createClassroomReference(classroomId, folderId, { kind: referenceKind as ClassroomReferenceKind, title: title.trim(), description: description.trim(), reviMaterialId: sourceFolderId }), "Não foi possível publicar a referência.")}><Link2 className="size-4" />{isSubmitting ? "Publicando…" : "Publicar referência"}</Button></Tabs.Panel>
    <Tabs.Panel id="copia" className="flex flex-col gap-4 pt-4"><p className="text-muted text-sm">Cria uma cópia imutável dos materiais disponíveis agora. Alterações futuras na pasta pessoal não serão compartilhadas.</p>{renderFolderSelect("Pasta pessoal para copiar")}{renderMetadata()}<Button className="w-full" isDisabled={!sourceFolderId || !title.trim() || isSubmitting} onPress={() => void submit(() => createClassroomMaterialSnapshot(classroomId, folderId, { sourceChildFolderId: sourceFolderId, title: title.trim(), description: description.trim() }), "Não foi possível criar a cópia.")}><Copy className="size-4" />{isSubmitting ? "Criando cópia…" : "Criar cópia"}</Button></Tabs.Panel>
  </Tabs>{materials === null && catalogError === null ? <div role="status" className="flex items-center gap-2 text-sm"><Spinner size="sm" />Carregando suas pastas pessoais…</div> : null}{catalogError !== null ? <p role="alert" className="text-danger text-sm">{catalogError}</p> : null}{error !== null ? <p role="alert" className="text-danger text-sm">{error}</p> : null}</Modal.Body></Modal.Dialog></Modal.Container></Modal.Backdrop></Modal>;
}
