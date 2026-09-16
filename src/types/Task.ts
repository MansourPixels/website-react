export type TaskSyncState = "local" | "sincronizada" | "falhou";

export interface Task {
  id: string;
  title: string;
  motherFolderId: string;
  // Nome e cor da matéria ficam congelados na tarefa de propósito: a lista
  // renderiza sem uma requisição por linha, e uma tarefa cuja pasta foi
  // apagada continua legível em vez de virar "—".
  motherFolderName: string;
  motherFolderColor: string;
  childFolderId: string | null;
  childFolderName: string | null;
  /** ISO. `atrasada` é derivado daqui, nunca persistido. */
  dueAt: string;
  done: boolean;
  completedAt: string | null;
  googleEventId: string | null;
  syncState: TaskSyncState;
  createdAt: string;
  updatedAt: string;
}

/** O que uma tela consegue informar; o resto é do seam de persistência. */
export interface TaskInput {
  title: string;
  motherFolderId: string;
  motherFolderName: string;
  motherFolderColor: string;
  childFolderId: string | null;
  childFolderName: string | null;
  dueAt: string;
}
