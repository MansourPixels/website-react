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

export function getEmailError(email: string): string | null {
  if (email.trim() === "") return "Informe seu e-mail.";
  if (!isValidEmail(email)) return "Digite um e-mail válido.";
  return null;
}

export function getUsernameError(username: string): string | null {
  if (username.trim() === "") return "Informe um nome de usuário.";
  if (!isValidUsername(username)) {
    return "Use de 3 a 30 letras, números, _ ou -, começando por letra ou número.";
  }
  return null;
}

export function getPasswordError(password: string): string | null {
  if (password === "") return "Informe sua senha.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  return null;
}
