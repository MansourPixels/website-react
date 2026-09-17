/**
 * Recorte público de um usuário do Revi — é o que aparece em busca, ranking,
 * lista de amigos e lista de membros de turma. Nunca carrega e-mail: a busca
 * por username não pode virar um vazamento de contato.
 */
export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  /** XP acumulado na temporada corrente (zera junto com ela). */
  xp: number;
}
