import { Button, Modal, Spinner } from "@heroui/react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { getClassroomMaterialSnapshot } from "@/api/classrooms";
import { ApiError } from "@/api/client";
import { Math } from "@/components/Math";
import type { ClassroomMaterialSnapshot, ClassroomQuizOption, ClassroomSnapshotMindMapBranch } from "@/types/api/classroom";
import { normalizeLatexDelimiters } from "@/utils/markdown";

const options: ClassroomQuizOption[] = ["A", "B", "C", "D"];

interface ClassroomSnapshotViewerProps {
  classroomId: string;
  folderId: string;
  contentId: string | null;
  onClose: () => void;
}

export function ClassroomSnapshotViewer({ classroomId, folderId, contentId, onClose }: ClassroomSnapshotViewerProps) {
  const [snapshot, setSnapshot] = useState<ClassroomMaterialSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contentId === null) return;
    const controller = new AbortController();
    setSnapshot(null); setError(null);
    getClassroomMaterialSnapshot(classroomId, folderId, contentId, controller.signal)
      .then((result) => { if (!controller.signal.aborted) setSnapshot(result); })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof ApiError ? reason.detail : "Não foi possível abrir esta cópia.");
      });
    return () => controller.abort();
  }, [classroomId, contentId, folderId]);

  return <Modal isOpen={contentId !== null} onOpenChange={(open) => { if (!open) onClose(); }}><Modal.Backdrop><Modal.Container><Modal.Dialog className="max-h-[90svh] sm:max-w-3xl"><Modal.CloseTrigger /><Modal.Header><Modal.Heading>Cópia da pasta</Modal.Heading></Modal.Header><Modal.Body className="overflow-y-auto"><p className="text-muted text-sm">Esta é uma cópia imutável, sem acesso à pasta pessoal de origem.</p>{snapshot !== null ? <SnapshotContent snapshot={snapshot} /> : error !== null ? <p role="alert" className="text-danger mt-4 text-sm">{error}</p> : <div role="status" className="flex items-center gap-2 py-8"><Spinner size="sm" />Carregando cópia…</div>}</Modal.Body></Modal.Dialog></Modal.Container></Modal.Backdrop></Modal>;
}

function SnapshotContent({ snapshot }: { snapshot: ClassroomMaterialSnapshot }) {
  const [answers, setAnswers] = useState<Map<number, ClassroomQuizOption>>(new Map());
  const copiedAt = new Date(snapshot.snapshottedAt).toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" });
  const answer = (index: number, option: ClassroomQuizOption) => setAnswers((previous) => new Map(previous).set(index, option));
  return <div className="mt-4 flex flex-col gap-6"><p className="text-muted text-sm">Copiada em <time dateTime={snapshot.snapshottedAt}>{copiedAt}</time></p>{snapshot.summary !== null ? <section aria-labelledby="snapshot-summary"><h3 id="snapshot-summary" className="mb-2 font-semibold">Resumo</h3><article className="bg-default rounded-xl p-4 prose-sm prose-zinc"><ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{normalizeLatexDelimiters(snapshot.summary)}</ReactMarkdown></article></section> : null}{snapshot.flashcards.length > 0 ? <section aria-labelledby="snapshot-flashcards"><h3 id="snapshot-flashcards" className="mb-2 font-semibold">Flash cards</h3><div className="grid gap-3 sm:grid-cols-2">{snapshot.flashcards.map((card, index) => <article key={`${card.front}-${index}`} className="border-separator rounded-xl border p-3"><p className="font-medium"><Math>{card.front}</Math></p><p className="text-muted mt-2 text-sm"><Math>{card.back}</Math></p></article>)}</div></section> : null}{snapshot.quizQuestions.length > 0 ? <section aria-labelledby="snapshot-quiz"><h3 id="snapshot-quiz" className="mb-2 font-semibold">Simulado</h3><div className="flex flex-col gap-5">{snapshot.quizQuestions.map((question, index) => { const selected = answers.get(index); return <fieldset key={`${question.question}-${index}`} className="border-separator rounded-xl border p-4"><legend className="px-1 font-medium"><Math>{question.question}</Math></legend><div className="mt-3 grid gap-2">{options.map((option) => { const text = ({ A: question.optionA, B: question.optionB, C: question.optionC, D: question.optionD })[option]; return <Button key={option} variant={selected === option ? "primary" : "secondary"} className="justify-start" aria-pressed={selected === option} onPress={() => answer(index, option)}>{option}. <Math>{text}</Math></Button>; })}</div>{selected ? <p className={`mt-3 text-sm ${selected === question.correctOption ? "text-success" : "text-danger"}`}>{selected === question.correctOption ? "Resposta correta." : `Resposta correta: ${question.correctOption}.`}</p> : null}</fieldset>; })}</div></section> : null}{snapshot.mindMapRoot !== null ? <section aria-labelledby="snapshot-map"><h3 id="snapshot-map" className="mb-2 font-semibold">Mapa mental</h3><MindMapBranch branch={snapshot.mindMapRoot} /></section> : null}</div>;
}

function MindMapBranch({ branch }: { branch: ClassroomSnapshotMindMapBranch }) {
  return <details className="border-separator rounded-xl border p-3" open><summary className="cursor-pointer font-medium"><Math>{branch.label}</Math></summary>{branch.detalhe ? <p className="text-muted mt-2 text-sm"><Math>{branch.detalhe}</Math></p> : null}{branch.formula ? <p className="mt-2"><Math>{branch.formula}</Math></p> : null}{branch.children?.length ? <div className="mt-3 ml-3 flex flex-col gap-2 border-l pl-3">{branch.children.map((child, index) => <MindMapBranch key={`${child.label}-${index}`} branch={child} />)}</div> : null}</details>;
}
