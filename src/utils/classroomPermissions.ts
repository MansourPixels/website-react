import type {
  ClassroomContent,
  ClassroomRole,
} from "@/types/api/classroom";

/**
 * Regras de permissão da turma. O papel vale para a turma inteira — não há
 * permissão por pasta.
 *
 * Estas funções decidem apenas o que a interface mostra. A recusa de verdade
 * acontece no service (hoje `src/api/classrooms.ts`, amanhã o backend), porque
 * esconder um botão não é autorização.
 */

export function canInviteMembers(role: ClassroomRole): boolean {
  return role === "owner";
}

export function canManageMembers(role: ClassroomRole): boolean {
  return role === "owner";
}

/** Dono e editor administram as pastas compartilhadas. */
export function canManageFolders(role: ClassroomRole): boolean {
  return role === "owner" || role === "editor";
}

export function canManageClassroom(role: ClassroomRole): boolean {
  return role === "owner";
}

/**
 * Criar, editar e excluir a entrega da turma. Concluir não passa por aqui:
 * a conclusão é de cada membro, inclusive do leitor, e o servidor guarda uma
 * por par (tarefa, pessoa).
 */
export function canManageClassroomTasks(role: ClassroomRole): boolean {
  return role === "owner" || role === "editor";
}

export function canAddContent(role: ClassroomRole): boolean {
  return role === "owner" || role === "editor";
}

/**
 * Editar é só do autor — inclusive para o dono, que modera excluindo, não
 * reescrevendo o material de outra pessoa.
 */
export function canEditContent(
  _role: ClassroomRole,
  content: { author: Pick<ClassroomContent["author"], "id"> },
  userId: string,
): boolean {
  return content.author.id === userId;
}

/** O dono exclui qualquer conteúdo da turma; os demais, só o próprio. */
export function canDeleteContent(
  role: ClassroomRole,
  content: { author: Pick<ClassroomContent["author"], "id"> },
  userId: string,
): boolean {
  if (role === "owner") return true;
  return content.author.id === userId;
}

/** O dono não sai da própria turma: excluiria a turma sem querer. */
export function canLeaveClassroom(role: ClassroomRole): boolean {
  return role !== "owner";
}

export function roleLabel(role: ClassroomRole): string {
  if (role === "owner") return "Dono";
  if (role === "editor") return "Editor";

  return "Membro";
}

export function roleDescription(role: ClassroomRole): string {
  if (role === "owner") return "Gerencia membros, pastas e todo o conteúdo.";
  if (role === "editor") return "Gerencia pastas e edita o que é seu.";

  return "Só consome o conteúdo da turma.";
}
