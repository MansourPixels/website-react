import { describe, expect, it } from "vitest";

import { profilePath } from "./profile";

describe("profilePath", () => {
  it("monta a rota do perfil público", () => {
    expect(profilePath("ana.souza")).toBe("/usuarios/ana.souza");
  });

  it("escapa caracteres que quebrariam a URL", () => {
    expect(profilePath("joão silva")).toBe("/usuarios/jo%C3%A3o%20silva");
    expect(profilePath("a/b")).toBe("/usuarios/a%2Fb");
  });
});
