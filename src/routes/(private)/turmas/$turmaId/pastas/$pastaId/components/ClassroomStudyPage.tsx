import { Button, ProgressBar, Spinner } from "@heroui/react";
import { ChevronRight, ListCheck, Sparkles, Waypoints, Zap } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import {
  getClassroomMindMap,
  getClassroomSummary,
  getFolder,
  listClassroomFlashcards,
  listClassroomQuiz,
} from "@/api/classrooms";
import { ApiError } from "@/api/client";
import { AlternativeOption } from "@/components/AlternativeOption";
import { FlashCard } from "@/components/FlashCard";
import { Math } from "@/components/Math";
import { MindMapCanvas } from "@/components/MindMapCanvas";
import { NavMenu } from "@/components/NavMenu";
import { SpeakButton } from "@/components/SpeakButton";
import { useMindMap } from "@/hooks/useMindMap";
import type {
  ClassroomFlashcard,
  ClassroomMindMap,
  ClassroomQuizOption,
  ClassroomQuizQuestion,
  ClassroomSummary,
} from "@/types/api/classroom";
import { normalizeLatexDelimiters } from "@/utils/markdown";
import { flashcardSpeech, markdownToSpeech, mindMapSpeech, quizSpeech } from "@/utils/speechText";
import { formatUploadDate } from "@/utils/time";

const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 60_000;
const OPTIONS: ClassroomQuizOption[] = ["A", "B", "C", "D"];

type StudyMode = "summary" | "flashcards" | "quiz" | "map";

export function ClassroomStudyPage({ mode }: { mode: StudyMode }) {
  const { turmaId, pastaId } = useParams();
  const navigate = useNavigate();
  const [folderName, setFolderName] = useState("");
  const [artifact, setArtifact] = useState<ClassroomSummary | ClassroomMindMap | ClassroomFlashcard[] | ClassroomQuizQuestion[] | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (turmaId === undefined || pastaId === undefined) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();
    setArtifact(undefined);
    setError(null);
    setTimedOut(false);

    const load = () => {
      const request = mode === "summary"
        ? getClassroomSummary(turmaId, pastaId, controller.signal)
        : mode === "flashcards"
          ? listClassroomFlashcards(turmaId, pastaId, controller.signal)
          : mode === "quiz"
            ? listClassroomQuiz(turmaId, pastaId, controller.signal)
            : getClassroomMindMap(turmaId, pastaId, controller.signal);
      request.then((result) => {
        if (controller.signal.aborted) return;
        setArtifact(result);
        const pending = result === null || (Array.isArray(result) && result.length === 0);
        if (!pending) return;
        if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
          setTimedOut(true);
          return;
        }
        timer = setTimeout(load, POLL_INTERVAL_MS);
      }).catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        if (reason instanceof ApiError && reason.status === 404) {
          navigate("/turmas", { replace: true });
          return;
        }
        setError(reason instanceof ApiError ? reason.detail : "Não foi possível carregar este modo de estudo. Tente novamente.");
      });
    };

    getFolder(turmaId, pastaId)
      .then((folder) => { if (!controller.signal.aborted) setFolderName(folder.name); })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted && reason instanceof ApiError && reason.status === 404) navigate("/turmas", { replace: true });
      });
    load();
    return () => { controller.abort(); if (timer !== undefined) clearTimeout(timer); };
  }, [mode, navigate, pastaId, reload, turmaId]);

  const title = mode === "summary" ? "Resumo" : mode === "flashcards" ? "Flash Cards" : mode === "quiz" ? "Simulado de prova" : "Mapa Mental";
  const backHref = turmaId === undefined || pastaId === undefined ? "/turmas" : `/turmas/${turmaId}/pastas/${pastaId}`;
  const pending = artifact === null || (Array.isArray(artifact) && artifact.length === 0);

  if (mode === "summary") return <Summary artifact={artifact as ClassroomSummary | null | undefined} title={title} folderName={folderName} backHref={backHref} error={error} pending={pending} timedOut={timedOut} onRetry={() => setReload((value) => value + 1)} />;
  if (mode === "flashcards") return <Flashcards artifact={artifact as ClassroomFlashcard[] | undefined} title={title} backHref={backHref} error={error} pending={pending} timedOut={timedOut} onRetry={() => setReload((value) => value + 1)} />;
  if (mode === "quiz") return <Quiz artifact={artifact as ClassroomQuizQuestion[] | undefined} title={title} backHref={backHref} error={error} pending={pending} timedOut={timedOut} onRetry={() => setReload((value) => value + 1)} />;
  return <MindMap artifact={artifact as ClassroomMindMap | null | undefined} title={title} backHref={backHref} error={error} pending={pending} timedOut={timedOut} onRetry={() => setReload((value) => value + 1)} />;
}

function State({ error, pending, timedOut, onRetry, label }: { error: string | null; pending: boolean; timedOut: boolean; onRetry: () => void; label: string }) {
  if (error !== null) return <div role="alert" className="flex flex-col items-center gap-4 py-8 text-danger"><p>{error}</p><Button variant="secondary" onPress={onRetry}>Tentar novamente</Button></div>;
  if (!pending) return null;
  return <section aria-busy="true" className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center"><Spinner size="lg" /><p className="font-medium">{timedOut ? `O ${label} ainda está sendo preparado.` : `O ${label} está sendo preparado para a turma.`}</p><p className="text-muted text-sm">{timedOut ? "Atualize para verificar novamente." : "Isso pode levar alguns instantes."}</p>{timedOut ? <Button variant="secondary" onPress={onRetry}>Atualizar</Button> : null}</section>;
}

function Summary({ artifact, title, folderName, backHref, error, pending, timedOut, onRetry }: { artifact: ClassroomSummary | null | undefined; title: string; folderName: string; backHref: string; error: string | null; pending: boolean; timedOut: boolean; onRetry: () => void }) {
  const summary = artifact ?? null;
  return <main className="content-bg-purple-200 flex-1"><div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-6 md:p-8"><NavMenu title={title} hasBackButton backHref={backHref} action={summary !== null ? <SpeakButton label="o resumo" text={() => markdownToSpeech(summary.markdown)} /> : null} />{error !== null || artifact === undefined ? <State error={error} pending={artifact === undefined} timedOut={false} onRetry={onRetry} label="resumo" /> : pending ? <State error={null} pending timedOut={timedOut} onRetry={onRetry} label="resumo" /> : summary !== null ? <><p className="text-muted -mt-5 text-sm">{folderName}</p><article className="bg-surface grid rounded-2xl p-4 shadow-surface prose-sm prose-zinc md:p-8 md:prose-base"><ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{normalizeLatexDelimiters(summary.markdown)}</ReactMarkdown></article><p className="text-muted text-center text-sm">Gerado {formatUploadDate(summary.generatedAt)}</p></> : null}</div></main>;
}

function Flashcards({ artifact, title, backHref, error, pending, timedOut, onRetry }: { artifact: ClassroomFlashcard[] | undefined; title: string; backHref: string; error: string | null; pending: boolean; timedOut: boolean; onRetry: () => void }) {
  const [index, setIndex] = useState(0); const [revealed, setRevealed] = useState(false);
  const cards = artifact ?? []; const card = cards[index];
  return <main className="content-bg-emerald-200 flex-1"><div className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-between gap-8 p-6 md:p-8"><div><NavMenu title={title} hasBackButton backHref={backHref} action={card ? <SpeakButton label={revealed ? "a resposta" : "a pergunta"} text={() => flashcardSpeech({ front: card.front, back: revealed ? card.back : null })} /> : null} />{cards.length > 0 ? <ProgressBar aria-label="Progresso" size="lg" value={((index + 1) / cards.length) * 100}><ProgressBar.Track><ProgressBar.Fill className="bg-emerald-500" /></ProgressBar.Track></ProgressBar> : null}</div>{error !== null || artifact === undefined ? <State error={error} pending={artifact === undefined} timedOut={false} onRetry={onRetry} label="flash cards" /> : pending ? <State error={null} pending timedOut={timedOut} onRetry={onRetry} label="flash cards" /> : card ? <><FlashCard question={card.front} answer={<Math>{card.back}</Math>} position={index + 1} total={cards.length} isAnswerRevealed={revealed} /><Button size="lg" fullWidth onPress={() => revealed ? (index === cards.length - 1 ? (setIndex(0), setRevealed(false)) : (setIndex(index + 1), setRevealed(false))) : setRevealed(true)}><Zap />{revealed ? index === cards.length - 1 ? "Recomeçar sessão" : "Próximo cartão" : "Revelar resposta"}</Button></> : null}</div></main>;
}

function Quiz({ artifact, title, backHref, error, pending, timedOut, onRetry }: { artifact: ClassroomQuizQuestion[] | undefined; title: string; backHref: string; error: string | null; pending: boolean; timedOut: boolean; onRetry: () => void }) {
  const [index, setIndex] = useState(0); const [selected, setSelected] = useState<ClassroomQuizOption | null>(null); const [answers, setAnswers] = useState<Map<string, ClassroomQuizOption>>(new Map()); const [finished, setFinished] = useState(false);
  const questions = artifact ?? []; const question = questions[index];
  const optionText = (option: ClassroomQuizOption) => question === undefined ? "" : ({ A: question.optionA, B: question.optionB, C: question.optionC, D: question.optionD })[option];
  const submit = (event: FormEvent) => { event.preventDefault(); if (question === undefined || selected === null) return; const next = new Map(answers).set(question.id, selected); setAnswers(next); setSelected(null); if (index === questions.length - 1) setFinished(true); else setIndex(index + 1); };
  const correct = questions.filter((item) => answers.get(item.id) === item.correctOption).length;
  return <main className="content-bg-orange-200 flex-1"><div className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-between gap-8 p-6 md:p-8"><div><NavMenu title={title} hasBackButton backHref={backHref} action={question && !finished ? <SpeakButton label="a pergunta e as alternativas" text={() => quizSpeech({ question: question.question, options: OPTIONS.map((letter) => ({ letter, text: optionText(letter) })) })} /> : null} /></div>{error !== null || artifact === undefined ? <State error={error} pending={artifact === undefined} timedOut={false} onRetry={onRetry} label="simulado" /> : pending ? <State error={null} pending timedOut={timedOut} onRetry={onRetry} label="simulado" /> : finished ? <section className="text-center"><h2 className="text-2xl font-semibold">Resultado local</h2><p className="text-muted mt-2">Você acertou {correct} de {questions.length} questões.</p><Button className="mt-6" onPress={() => { setIndex(0); setAnswers(new Map()); setFinished(false); }}>Refazer simulado</Button></section> : question ? <form onSubmit={submit} className="flex flex-1 flex-col justify-between gap-6"><fieldset className="flex flex-col gap-4"><legend className="sr-only">{question.question}</legend><div><span className="opacity-70">Pergunta {index + 1} de {questions.length}</span><h2 className="text-2xl font-semibold"><Math>{question.question}</Math></h2></div><ul className="flex flex-col gap-3">{OPTIONS.map((option) => <li key={option}><AlternativeOption letter={option} isSelected={selected === option} onSelect={() => setSelected(option)}><Math>{optionText(option)}</Math></AlternativeOption></li>)}</ul></fieldset><Button type="submit" size="lg" fullWidth isDisabled={selected === null}>{index === questions.length - 1 ? <ListCheck /> : <ChevronRight />}{index === questions.length - 1 ? "Finalizar simulado" : "Próxima pergunta"}</Button></form> : null}</div></main>;
}

function MindMap({ artifact, title, backHref, error, pending, timedOut, onRetry }: { artifact: ClassroomMindMap | null | undefined; title: string; backHref: string; error: string | null; pending: boolean; timedOut: boolean; onRetry: () => void }) {
  const root = artifact?.raiz ?? null; const { placements, revealedCount, total, isComplete, toggle, expandAll } = useMindMap(root);
  return <main className="content-bg-cyan-200 flex h-[100svh] flex-col overflow-hidden"><div className="flex min-h-0 flex-1 flex-col gap-4 py-6 md:py-8"><div className="mx-auto w-full max-w-4xl px-6 md:px-8"><NavMenu title={title} hasBackButton backHref={backHref} action={root ? <SpeakButton label="o mapa" text={() => mindMapSpeech(root)} /> : null} />{root ? <ProgressBar aria-label="Progresso" size="lg" value={total === 0 ? 0 : (revealedCount / total) * 100}><ProgressBar.Track><ProgressBar.Fill className="bg-cyan-600" /></ProgressBar.Track></ProgressBar> : null}</div>{error !== null || artifact === undefined ? <State error={error} pending={artifact === undefined} timedOut={false} onRetry={onRetry} label="mapa mental" /> : pending ? <State error={null} pending timedOut={timedOut} onRetry={onRetry} label="mapa mental" /> : root ? <><div className="min-h-0 flex-1 overflow-hidden rounded-2xl"><MindMapCanvas root={root} placements={placements} onToggle={toggle} fitKey={placements.length} /></div><footer className="mx-auto flex w-full max-w-4xl gap-3 px-6 md:px-8"><Button fullWidth variant="tertiary" size="lg" onPress={expandAll} isDisabled={isComplete}><Sparkles />Expandir tudo</Button><Button fullWidth size="lg"><Waypoints />Explorar mapa</Button></footer></> : null}</div></main>;
}
