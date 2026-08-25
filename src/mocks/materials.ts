import type { Material } from "@/types/Material";

export const subjectMaterials: Material[] = [
  {
    id: "pdf-lista-04",
    kind: "pdf",
    url: "/materiais/lista-de-exercicios.pdf",
    name: "Lista de exercícios 04.pdf",
    pages: 3,
    size: 3080,
    uploadedAt: "2026-08-22T14:32:00.000Z",
  },
  ...Array.from({ length: 8 }, (_, index): Material => ({
    id: `imagem-${index}`,
    kind: "image",
    url: `https://picsum.photos/300/300?random=${index}`,
    name: `Foto do caderno ${index + 1}`,
  })),
];
