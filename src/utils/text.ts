/**
 * Normaliza um texto para comparação: minúsculas, sem acentos e sem
 * espaços extras. Assim "portugues" também encontra "Português".
 */
export function normalizeText(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}
