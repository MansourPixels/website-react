import type { DeadLetterQueue, FailureSource } from "@/types/api/admin";

/** O máximo de mensagens que o backend reenvia ou descarta numa chamada. */
export const DEAD_LETTER_MOVE_MAX = 1000;

/** O trabalho de cada fila morta, pelo nome técnico sem o prefixo `revi.` e o sufixo `.dlq`. */
const QUEUE_LABELS: Record<string, string> = {
  "content.categorization": "Categorização de material",
  "content.media-processing": "Transcrição de mídia",
  "summary.generation": "Resumo da pasta",
  "summary.summarized-trigger": "Resumo da pasta após novo material",
  "quiz.generation": "Geração de quiz",
  "quiz.summarized-trigger": "Quiz da pasta após novo material",
  "quiz.media-generation": "Quiz de mídia",
  "flashcards.generation": "Geração de flashcards",
  "flashcards.summarized-trigger": "Flashcards da pasta após novo material",
  "flashcards.media-generation": "Flashcards de mídia",
  "mindmap.generation": "Geração de mapa mental",
  "mindmap.summarized-trigger": "Mapa mental da pasta após novo material",
  "mindmap.media-generation": "Mapa mental de mídia",
  "studyplan.generation": "Geração de plano de estudos",
  "classrooms.content-processing": "Processamento de material da turma",
  "classrooms.media-processing": "Transcrição de mídia da turma",
  "classrooms.summary-generation": "Resumo da turma",
  "classrooms.quiz-generation": "Quiz da turma",
  "classrooms.flashcards-generation": "Flashcards da turma",
  "classrooms.mind-map-generation": "Mapa mental da turma",
  "classrooms.media-quiz": "Quiz de mídia da turma",
  "classrooms.media-flashcards": "Flashcards de mídia da turma",
  "classrooms.media-mind-map": "Mapa mental de mídia da turma",
  "tasks.calendar": "Sincronização com o Google Agenda",
  "tasks.membership-trigger": "Tarefas de quem entra ou sai da turma",
  "notifications.classroom-invites": "E-mail de convite para turma",
  "notifications.classroom-membership": "E-mail de entrada em turma",
  "notifications.classroom-tasks": "E-mail de tarefa da turma",
  "notifications.due-reminder": "E-mail de lembrete de prazo",
  "notifications.friends": "E-mail de amizade",
};

/** O nome em português do trabalho de uma fila morta; um nome desconhecido aparece como veio. */
export function queueLabel(name: string): string {
  const key = name.replace(/^revi\./, "").replace(/\.dlq$/, "");

  return QUEUE_LABELS[key] ?? name;
}

/** As filas com mensagens primeiro (mais mensagens antes), depois pelo nome em português. */
export function sortQueues(queues: DeadLetterQueue[]): DeadLetterQueue[] {
  return [...queues].sort(
    (a, b) => b.messages - a.messages || queueLabel(a.name).localeCompare(queueLabel(b.name), "pt-BR"),
  );
}

const REASON_LABELS: Record<string, string> = {
  rejected: "rejeitada",
  expired: "expirada",
  maxlen: "fila cheia",
  delivery_limit: "limite de entregas",
};

/** Por que o RabbitMQ mandou a mensagem para a fila morta. */
export function reasonLabel(reason: string | null): string {
  if (reason === null) return "motivo não registrado";

  return REASON_LABELS[reason] ?? reason;
}

const ID_LABELS: Record<string, string> = {
  contentId: "Material",
  folderId: "Pasta",
  childFolderId: "Subpasta",
  ownerId: "Dono",
  classroomId: "Turma",
  taskId: "Tarefa",
  userId: "Usuário",
};

/** O nome de um id do corpo de uma mensagem (`contentId` → "Material"); um desconhecido aparece como veio. */
export function idLabel(field: string): string {
  return ID_LABELS[field] ?? field;
}

export function failureSourceLabel(source: FailureSource): string {
  return source === "categorization" ? "Categorização" : "Turma";
}

export type QueuesTab = "filas" | "falhas";

export interface QueuesSearch {
  tab: QueuesTab;
  /** A fila morta aberta, pelo nome técnico. */
  queue: string | null;
  source: FailureSource | null;
  /** Começa em 1, como na URL. */
  page: number;
}

/** Lê `?aba=falhas`, `?fila=`, `?origem=` e `?pagina=`; o que for inválido volta ao padrão. */
export function queuesSearchFromUrl(params: URLSearchParams): QueuesSearch {
  const origem = params.get("origem");
  const page = Number(params.get("pagina"));
  const queue = params.get("fila");

  return {
    tab: params.get("aba") === "falhas" ? "falhas" : "filas",
    queue: queue !== null && queue.length > 0 ? queue : null,
    source: origem === "categorizacao" ? "categorization" : origem === "turma" ? "classroom-processing" : null,
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  };
}

/** A URL de uma visão da tela, sem os valores padrão. */
export function queuesSearchToUrl({ tab, queue, source, page }: QueuesSearch): URLSearchParams {
  const params = new URLSearchParams();

  if (tab === "falhas") {
    params.set("aba", "falhas");
    if (source !== null) params.set("origem", source === "categorization" ? "categorizacao" : "turma");
    if (page > 1) params.set("pagina", String(page));
  } else if (queue !== null) {
    params.set("fila", queue);
  }

  return params;
}
