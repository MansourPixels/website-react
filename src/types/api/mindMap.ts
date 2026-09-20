export interface MindMapBranch {
  id: string;
  label: string;
  detalhe?: string;
  formula?: string;
  /** O segundo do áudio a que o nó se refere; só no mapa de um áudio. */
  startSeconds?: number | null;
  children?: MindMapBranch[];
}

export interface MindMap {
  assunto: string;
  raiz: MindMapBranch | null;
  generatedAt: string | null;
}
