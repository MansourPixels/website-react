export const MIN_NAME_LENGTH = 3;
export const MIN_PASSWORD_LENGTH = 6;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string) {
  return emailPattern.test(email.trim());
}
