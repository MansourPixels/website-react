export interface Categorization {
  disciplina: string;
  assunto: string;
}

export function categorizeImage(): Promise<Categorization> {
  return new Promise((resolve) => {
    setTimeout(
      () =>
        resolve({
          disciplina: "Matemática",
          assunto: "Equação de terceiro grau",
        }),
      2000,
    );
  });
}
