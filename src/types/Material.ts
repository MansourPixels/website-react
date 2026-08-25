export type MaterialKind = "image" | "pdf";

export interface Material {
  id: string;
  kind: MaterialKind;
  url: string;
  name: string;
  pages?: number;
  size?: number;
  uploadedAt?: string;
}
