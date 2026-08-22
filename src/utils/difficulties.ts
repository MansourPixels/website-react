export const difficulties = [
  { id: "facil", label: "Fácil", image: "/dificuldades/facil.svg" },
  { id: "medio", label: "Médio", image: "/dificuldades/medio.svg" },
  { id: "dificil", label: "Difícil", image: "/dificuldades/dificil.svg" },
] as const;

export type Difficulty = "dificil" | "medio" | "facil";
