/** A URL de reprodução é presignada e vale 15 minutos (`download-url`). */
export const URL_TTL_MS = 15 * 60_000;

/** Renova um pouco antes de vencer, para o áudio não engasgar no meio de uma frase. */
export const URL_RENEW_MARGIN_MS = 3 * 60_000;

/** Quantas renovações seguidas valem a pena antes de desistir e mostrar erro. */
export const MAX_RENEWALS_IN_WINDOW = 3;
export const RENEWAL_WINDOW_MS = 60_000;

/** Se a URL, pedida em `loadedAt`, já está perto de vencer (ou vencida) em `now`. */
export function isUrlStale(loadedAt: number, now: number): boolean {
  return now - loadedAt >= URL_TTL_MS - URL_RENEW_MARGIN_MS;
}

/**
 * Se ainda vale renovar a URL. Uma URL que falha logo depois de renovada não
 * está vencida: o arquivo sumiu ou o servidor caiu, e renovar de novo em laço
 * só esconderia isso. `renewals` são os instantes das renovações anteriores.
 */
export function canRenewUrl(renewals: readonly number[], now: number): boolean {
  return (
    renewals.filter((at) => now - at < RENEWAL_WINDOW_MS).length <
    MAX_RENEWALS_IN_WINDOW
  );
}

/** `MediaError.code` de um arquivo que o navegador não sabe decodificar (`MEDIA_ERR_SRC_NOT_SUPPORTED`). */
const MEDIA_ERR_SRC_NOT_SUPPORTED = 4;

/**
 * O que fazer quando o elemento de mídia dispara `error`. O navegador dá o mesmo
 * código (`SRC_NOT_SUPPORTED`) a um formato que não toca e a uma URL vencida, que
 * devolve um XML de erro em vez de mídia. O que separa os dois é a idade da URL:
 * uma URL recém pedida que falha ao carregar não venceu, o formato é que não é
 * suportado (um `.mov` ou `.mkv` que não é H.264/AAC, por exemplo), e renovar só
 * repetiria o erro. Qualquer outra falha é tratada como URL vencida.
 */
export function classifyMediaError(
  code: number | null | undefined,
  urlAgeMs: number,
): "unsupported" | "renew" {
  return code === MEDIA_ERR_SRC_NOT_SUPPORTED &&
    !isUrlStale(0, urlAgeMs)
    ? "unsupported"
    : "renew";
}
