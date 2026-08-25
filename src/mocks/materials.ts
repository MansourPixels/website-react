import type { Material } from "@/types/Material";

export function createImageMaterial(subjectId: string, index: number): Material {
  return {
    id: `${subjectId}-imagem-${index}`,
    kind: "image",
    url: `https://picsum.photos/seed/${subjectId}-${index}/300/300`,
    name: `Foto do caderno ${index + 1}`,
  };
}

export function createExerciseListMaterial(subjectId: string): Material {
  return {
    id: `${subjectId}-pdf-lista-04`,
    kind: "pdf",
    url: "/materiais/lista-de-exercicios.pdf",
    name: "Lista de exercícios 04.pdf",
    pages: 3,
    size: 3080,
    uploadedAt: "2026-08-22T14:32:00.000Z",
  };
}
