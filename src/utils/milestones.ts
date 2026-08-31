export interface Milestone {
  title: string;
  description: string;
  goal: number;
}

/**
 * Metas fixas do lado do cliente — não vêm da API, só marcam pontos na
 * sequência real (`currentStreak`) que o back devolve. Ficam aqui, e não na
 * lista que as desenha, porque a detecção de conquista precisa exatamente dos
 * mesmos valores: duas cópias divergiriam sem ninguém perceber.
 */
export const milestones: Milestone[] = [
  { title: "Primeira chama", description: "3 dias seguidos de estudo", goal: 3 },
  { title: "Semana completa", description: "7 dias seguidos de estudo", goal: 7 },
  { title: "Duas semanas", description: "14 dias seguidos de estudo", goal: 14 },
  { title: "Mês em ascensão", description: "30 dias seguidos de estudo", goal: 30 },
];
