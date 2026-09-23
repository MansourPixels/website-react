import { describe, expect, it } from "vitest";

import { ApiError } from "@/api/client";

import { accountActionError, adminLoadError } from "./adminErrors";

function apiError(status: number): ApiError {
  return new ApiError(status, "do servidor");
}

describe("accountActionError", () => {
  it.each([
    [409, "Você não pode desativar a sua própria conta."],
    [404, "Esta conta não existe mais."],
    [503, "O serviço de contas está fora do ar. Tente de novo em instantes."],
    [500, "Não foi possível concluir agora."],
  ])("explains a %i", (status, message) => {
    expect(accountActionError(apiError(status))).toBe(message);
  });

  it("explains an error that did not come from the server", () => {
    expect(accountActionError(new TypeError("offline"))).toBe("Não foi possível concluir agora.");
  });
});

describe("adminLoadError", () => {
  it("explains a service that is down", () => {
    expect(adminLoadError(apiError(503), "Falhou.")).toBe(
      "Um serviço do servidor está fora do ar. Tente de novo em instantes.",
    );
  });

  it("uses the block's own message otherwise, never the server's English detail", () => {
    expect(adminLoadError(apiError(500), "Falhou.")).toBe("Falhou.");
    expect(adminLoadError(new TypeError("offline"), "Falhou.")).toBe("Falhou.");
  });
});
