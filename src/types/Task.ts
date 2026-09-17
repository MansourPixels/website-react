export type TaskSyncState = "local" | "sincronizada" | "falhou";

export interface Task {
  id: string;
  title: string;
  motherFolderId: string;
  // Nome e cor da matéria vêm congelados do servidor de propósito: a lista
  // renderiza sem uma requisição por linha, e uma tarefa cuja pasta foi
  // apagada continua legível em vez de virar "—".
  motherFolderName: string;
  motherFolderColor: string;
  childFolderId: string | null;
  childFolderName: string | null;
  /** ISO. `atrasada` é derivado daqui, nunca persistido. */
  dueAt: string;
  // `done`, `completedAt`, `googleEventId` e `syncState` são resolvidos para
  // *quem chamou*, não são propriedades da tarefa: dois membros da mesma turma
  // veem estados diferentes para a mesma entrega.
  done: boolean;
  completedAt: string | null;
  googleEventId: string | null;
  syncState: TaskSyncState;
  /** `null` em tarefa pessoal; preenchido no que veio de uma turma. */
  classroomId: string | null;
  classroomName: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * O que uma tela consegue informar.
 *
 * Nome e cor da pasta **não** entram aqui: o servidor os resolve a partir de
 * `motherFolderId` e guarda o snapshot. O cliente não é fonte de verdade para
 * o nome de uma pasta que o servidor conhece.
 */
export interface TaskInput {
  title: string;
  motherFolderId: string;
  childFolderId: string | null;
  dueAt: string;
}
