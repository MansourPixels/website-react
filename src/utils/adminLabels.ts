const FEATURES: Record<string, string> = {
  "content-ocr": "Leitura de imagem (OCR)",
  "content-summary": "Resumo de material",
  "content-summary-combine": "Resumo de material (junção)",
  "folder-suggestion": "Sugestão de pasta",
  "folder-summary": "Resumo da pasta",
  "folder-quiz": "Simulado da pasta",
  "folder-flashcards": "Flashcards da pasta",
  "folder-mind-map": "Mapa mental da pasta",
  "media-insights": "Análise de mídia",
  "media-insights-combine": "Análise de mídia (junção)",
  "media-quiz": "Simulado de mídia",
  "media-flashcards": "Flashcards de mídia",
  "media-mind-map": "Mapa mental de mídia",
  "media-mind-map-assemble": "Mapa mental de mídia (junção)",
  "media-transcription": "Transcrição",
  unattributed: "Sem funcionalidade",
};

const TRIGGERS: Record<string, string> = {
  MANUAL: "Ação do usuário",
  AUTOMATIC: "Automático",
  SWEEP: "Varredura",
};

const OUTCOMES: Record<string, string> = {
  SUCCESS: "Sucesso",
  FAILURE: "Falha",
};

/** O nome de uma funcionalidade na tela; uma desconhecida aparece como veio. */
export function featureLabel(key: string | null): string {
  return key === null ? "—" : (FEATURES[key] ?? key);
}

export function triggerLabel(key: string | null): string {
  return key === null ? "—" : (TRIGGERS[key] ?? key);
}

export function outcomeLabel(key: string | null): string {
  return key === null ? "—" : (OUTCOMES[key] ?? key);
}
