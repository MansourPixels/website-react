import { describe, expect, it } from "vitest";

import {
  buildAvatarUrl,
  DEFAULT_AVATAR_CONFIG,
  parseAvatarUrl,
  randomAvatarConfig,
  sanitizeAvatarConfig,
  type AvatarConfig,
} from "./avatar";

const CUSTOM_CONFIG: AvatarConfig = {
  accessories: "sunglasses",
  eyes: "cheery",
  hair: "mohawk",
  mouth: "kwaii",
  hairColor: "220f00",
  skinColor: "ffe4c0",
  backgroundColor: "ff5d8f",
};

describe("buildAvatarUrl", () => {
  it("codifica cada peça da config como query param", () => {
    const url = new URL(buildAvatarUrl(CUSTOM_CONFIG));

    expect(url.pathname).toContain("big-smile");
    expect(url.searchParams.get("accessoriesVariant")).toBe("sunglasses");
    expect(url.searchParams.get("accessoriesProbability")).toBe("100");
    expect(url.searchParams.get("eyesVariant")).toBe("cheery");
    expect(url.searchParams.get("hairVariant")).toBe("mohawk");
    expect(url.searchParams.get("mouthVariant")).toBe("kwaii");
    expect(url.searchParams.get("hairColor")).toBe("220f00");
  });

  it("zera a probabilidade de acessório quando accessories é null", () => {
    const url = new URL(buildAvatarUrl({ ...CUSTOM_CONFIG, accessories: null }));

    expect(url.searchParams.get("accessoriesProbability")).toBe("0");
    expect(url.searchParams.has("accessoriesVariant")).toBe(false);
  });
});

describe("parseAvatarUrl", () => {
  it("recupera exatamente a config que buildAvatarUrl gerou (round-trip)", () => {
    expect(parseAvatarUrl(buildAvatarUrl(CUSTOM_CONFIG))).toEqual(CUSTOM_CONFIG);
  });

  it("recupera accessories: null quando a probabilidade é 0", () => {
    const config = { ...CUSTOM_CONFIG, accessories: null };

    expect(parseAvatarUrl(buildAvatarUrl(config))).toEqual(config);
  });

  it("devolve null pra URL fora do endpoint big-smile", () => {
    expect(parseAvatarUrl("https://api.dicebear.com/10.x/bottts/svg")).toBeNull();
  });

  it("devolve null pra URL inválida", () => {
    expect(parseAvatarUrl("nem-url-isso")).toBeNull();
  });

  // O default de primeiro acesso do backend (?seed=<ownerId>, sem nenhum dos
  // parâmetros do construtor) não pode virar uma config fixa — regressão que
  // fez todo mundo sem avatar customizado ver o mesmo cabelo/olhos/boca no
  // editor, diferente do avatar de verdade salvo no perfil.
  it("devolve null pra URL seed-based do backend, sem parâmetros do editor", () => {
    const seedUrl = "https://api.dicebear.com/10.x/big-smile/svg?seed=abc-123";

    expect(parseAvatarUrl(seedUrl)).toBeNull();
  });
});

describe("sanitizeAvatarConfig", () => {
  it("cai no default campo a campo quando o valor é irreconhecível", () => {
    const result = sanitizeAvatarConfig({
      accessories: "isso-nao-existe",
      eyes: 42,
      hairColor: "não é hex",
    });

    expect(result).toEqual(DEFAULT_AVATAR_CONFIG);
  });

  it("preserva accessories: null como 'sem acessório', distinto de ausente", () => {
    expect(sanitizeAvatarConfig({ accessories: null }).accessories).toBeNull();
    expect(sanitizeAvatarConfig({}).accessories).toBe(
      DEFAULT_AVATAR_CONFIG.accessories,
    );
  });

  it("aceita hex com # e normaliza pra minúsculo sem #", () => {
    expect(sanitizeAvatarConfig({ hairColor: "#ABCDEF" }).hairColor).toBe(
      "abcdef",
    );
  });

  it("trata entrada undefined/null como objeto vazio", () => {
    expect(sanitizeAvatarConfig(undefined)).toEqual(DEFAULT_AVATAR_CONFIG);
  });
});

describe("randomAvatarConfig", () => {
  it("sempre sorteia uma config válida (round-trip por buildAvatarUrl)", () => {
    for (let i = 0; i < 20; i++) {
      const config = randomAvatarConfig();

      expect(parseAvatarUrl(buildAvatarUrl(config))).toEqual(config);
    }
  });
});
