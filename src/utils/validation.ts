export const MIN_PASSWORD_LENGTH = 8;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Espelha a validação do back: 3–30 caracteres, letras/dígitos/_/-, começando
// por letra ou dígito.
const usernamePattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]{2,29}$/;

export function isValidEmail(email: string) {
  return emailPattern.test(email.trim());
}

export function isValidUsername(username: string) {
  return usernamePattern.test(username.trim());
}
