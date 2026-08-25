import type { Material } from "@/types/Material";

export interface Subject {
  id: string;
  name: string;
  materials: Material[];
}
