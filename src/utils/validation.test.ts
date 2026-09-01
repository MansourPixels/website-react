import { describe, expect, it } from "vitest";

import {
  getEmailError,
  getPasswordError,
  getUsernameError,
  isValidEmail,
  isValidUsername,
  MIN_PASSWORD_LENGTH,
} from "./validation";

describe("isValidEmail", () => {
  it.each(["aluno@example.com", "a.b+c@sub.example.com"])(
    "aceita %s",
    (email) => {
      expect(isValidEmail(email)).toBe(true);
    },
  );

  it.each(["", "sem-arroba.com", "a@b", "a b@example.com", "@example.com"])(
    "rejeita %s",
    (email) => {
      expect(isValidEmail(email)).toBe(false);
    },
  );
});

describe("isValidUsername", () => {
  it.each(["aluno", "Aluno_123", "a-b-c", "abc"])("aceita %s", (username) => {
    expect(isValidUsername(username)).toBe(true);
  });

  it.each([
    "",
    "ab", // menor que 3
    "aluno teste", // espaço
    "_aluno", // começa com símbolo
    "a".repeat(31), // maior que 30
  ])("rejeita %s", (username) => {
    expect(isValidUsername(username)).toBe(false);
  });
});

describe("getEmailError", () => {
  it("pede o e-mail quando vazio", () => {
    expect(getEmailError("")).toBe("Informe seu e-mail.");
  });

  it("aponta e-mail inválido quando malformado", () => {
    expect(getEmailError("nao-e-email")).toBe("Digite um e-mail válido.");
  });

  it("não erra pra e-mail válido", () => {
    expect(getEmailError("aluno@example.com")).toBeNull();
  });
});

describe("getUsernameError", () => {
  it("pede o usuário quando vazio", () => {
    expect(getUsernameError("")).toBe("Informe um nome de usuário.");
  });

  it("explica o formato quando inválido", () => {
    expect(getUsernameError("a b")).toBe(
      "Use de 3 a 30 letras, números, _ ou -, começando por letra ou número.",
    );
  });

  it("não erra pra usuário válido", () => {
    expect(getUsernameError("AlunoTeste")).toBeNull();
  });
});

describe("getPasswordError", () => {
  it("pede a senha quando vazia", () => {
    expect(getPasswordError("")).toBe("Informe sua senha.");
  });

  it("reclama do tamanho mínimo", () => {
    expect(getPasswordError("1234567")).toBe(
      `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`,
    );
  });

  it("não erra na senha com o tamanho mínimo exato", () => {
    expect(getPasswordError("1234567890".slice(0, MIN_PASSWORD_LENGTH))).toBeNull();
  });
});
