export interface MindMapBranch {
  id: string;
  label: string;
  detalhe?: string;
  formula?: string;
  children?: MindMapBranch[];
}

export interface MindMap {
  assunto: string;
  raiz: MindMapBranch | null;
  generatedAt: string | null;
}
