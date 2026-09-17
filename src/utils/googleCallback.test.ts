import { describe, expect, it } from "vitest";

import { googleCallbackErrorMessage } from "./googleCallback";

describe("googleCallbackErrorMessage", () => {
  it("traduz os erros conhecidos do callback sem expor detalhes", () => {
    expect(googleCallbackErrorMessage("access_denied")).toBe("Você cancelou a conexão com o Google.");
    expect(googleCallbackErrorMessage("invalid_state")).toContain("confirmar");
    expect(googleCallbackErrorMessage("no_refresh_token")).toContain("acesso contínuo");
  });

  it("mantém sucesso sem erro e usa uma mensagem segura para erros desconhecidos", () => {
    expect(googleCallbackErrorMessage(null)).toBeNull();
    expect(googleCallbackErrorMessage("unexpected")).toBe("Não foi possível concluir a conexão com o Google.");
  });
});
