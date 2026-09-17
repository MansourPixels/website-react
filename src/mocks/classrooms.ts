import type { Classroom } from "@/types/api/classroom";

/** Turmas de demonstração da landing, com dois papéis diferentes. */
export const defaultClassrooms: Classroom[] = [
  {
    id: "turma-1",
    name: "3º ano B, manhã",
    description:
      "O que a gente fotografa na aula fica aqui, aberto para a turma inteira.",
    color: "#388cf9",
    ownerId: "u-1",
    ownerUsername: "ericknathan",
    role: "owner",
    memberCount: 28,
    folderCount: 6,
    createdAt: "2026-02-17T12:00:00.000Z",
  },
  {
    id: "turma-2",
    name: "Cálculo I, noturno",
    description: "Listas, provas antigas e o resumo que cada um foi montando.",
    color: "#44af69",
    ownerId: "u-2",
    ownerUsername: "Abreu-Enzo",
    role: "editor",
    memberCount: 41,
    folderCount: 9,
    createdAt: "2026-03-04T12:00:00.000Z",
  },
];
