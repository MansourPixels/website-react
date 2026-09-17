import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));

vi.mock("./client", () => ({ apiFetch }));

import {
  disconnectGoogle,
  getGoogleAuthorizeUrl,
  getGoogleConnectionStatus,
  getGoogleToken,
} from "./google";

describe("google API", () => {
  beforeEach(() => apiFetch.mockReset());

  it("usa os contratos de status, token e desconexão", async () => {
    await getGoogleConnectionStatus();
    await getGoogleToken();
    await disconnectGoogle();

    expect(apiFetch).toHaveBeenNthCalledWith(1, "/api/google/status");
    expect(apiFetch).toHaveBeenNthCalledWith(2, "/api/google/token");
    expect(apiFetch).toHaveBeenNthCalledWith(3, "/api/google/connection", { method: "DELETE" });
  });

  it("codifica retorno interno e fuso horário na autorização", async () => {
    await getGoogleAuthorizeUrl("/pastas?busca=álgebra", "America/Sao_Paulo");

    expect(apiFetch).toHaveBeenCalledWith(
      "/api/google/authorize-url?returnTo=%2Fpastas%3Fbusca%3D%C3%A1lgebra&timeZone=America%2FSao_Paulo",
    );
  });
});
