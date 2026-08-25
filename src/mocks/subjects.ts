import type { Subject } from "@/types/Subject";

function createSubject(id: string, name: string): Subject {
  return {
    id,
    name,
    images: Array.from(
      { length: 4 },
      (_, index) => `https://picsum.photos/seed/${id}-${index}/300/300`,
    ),
  };
}

export const defaultSubjectsByFolder: Record<string, Subject[]> = {
  // Português
  "1": [
    createSubject("1-1", "Figuras de linguagem"),
    createSubject("1-2", "Concordância verbal e nominal"),
  ],
  // Matemática
  "2": [
    createSubject("2-1", "Equação de terceiro grau"),
    createSubject("2-2", "Trigonometria no triângulo retângulo"),
    createSubject("2-3", "Progressão aritmética e geométrica"),
    createSubject("2-4", "Funções exponenciais"),
    createSubject("2-5", "Logaritmos"),
    createSubject("2-6", "Geometria espacial"),
    createSubject("2-7", "Análise combinatória"),
    createSubject("2-8", "Probabilidade"),
  ],
  // Geografia
  "3": [
    createSubject("3-1", "Climas do Brasil"),
    createSubject("3-2", "Globalização e blocos econômicos"),
    createSubject("3-3", "Urbanização e êxodo rural"),
  ],
  // Sociologia
  "4": [
    createSubject("4-1", "Movimentos sociais"),
    createSubject("4-2", "Cultura e indústria cultural"),
    createSubject("4-3", "Estratificação social"),
  ],
  // História
  "5": [
    createSubject("5-1", "Revolução Industrial"),
    createSubject("5-2", "Era Vargas"),
    createSubject("5-3", "Guerra Fria"),
  ],
};

export function getSubjectsByFolder(folderId: string): Subject[] {
  return defaultSubjectsByFolder[folderId] ?? [];
}
