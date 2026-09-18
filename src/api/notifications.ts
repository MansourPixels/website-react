import type {
  NotificationCategoryKey,
  NotificationPreferences,
} from "@/types/api/notifications";

import { apiFetch } from "./client";

/**
 * Preferências de e-mail. A API nunca devolve nem aceita o endereço da pessoa:
 * só as quatro categorias, cada uma com um booleano. Quem nunca mexeu tem as
 * quatro em `true`.
 */
export function getNotificationPreferences(
  signal?: AbortSignal,
): Promise<NotificationPreferences> {
  return apiFetch<NotificationPreferences>("/api/notifications/preferences", {
    signal,
  });
}

/**
 * Manda **só as chaves alteradas**: o servidor aceita qualquer subconjunto e
 * devolve as quatro. É `PATCH` e não `PUT` porque o CORS do backend não libera
 * `PUT`. Corpo vazio, só com chaves desconhecidas ou com valor não booleano
 * toma `400`.
 */
export function updateNotificationPreferences(
  changes: Partial<Record<NotificationCategoryKey, boolean>>,
): Promise<NotificationPreferences> {
  return apiFetch<NotificationPreferences>("/api/notifications/preferences", {
    method: "PATCH",
    body: changes,
  });
}

/**
 * Rota **pública**: quem clica no link do e-mail pode não ter sessão, então
 * nenhum `Authorization` é anexado (`auth: false`). O token é opaco e vai na
 * query string, por isso passa por `encodeURIComponent` — um token em base64
 * pode ter `+`, `/` e `=`, que a query string interpretaria de outro jeito.
 *
 * Responde `200` sem corpo e é idempotente. `400` é sempre o mesmo para token
 * inválido, adulterado ou vazio; `429` para excesso de tentativas.
 */
export function unsubscribeWithToken(token: string): Promise<void> {
  return apiFetch<void>(
    `/api/notifications/unsubscribe?token=${encodeURIComponent(token)}`,
    { method: "POST", auth: false },
  );
}
