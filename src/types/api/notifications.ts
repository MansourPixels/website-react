/**
 * As quatro categorias de e-mail que a pessoa pode ligar ou desligar. Os
 * e-mails de verificação de conta e de redefinição de senha são do Keycloak e
 * não passam por aqui.
 */
export type NotificationCategoryKey =
  | "friends"
  | "classrooms"
  | "tasks"
  | "reminders";

export type NotificationPreferences = Record<NotificationCategoryKey, boolean>;
