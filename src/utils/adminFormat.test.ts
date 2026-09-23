import { describe, expect, it } from "vitest";

import { countOf, formatCount, formatMoney } from "./adminFormat";

// O Intl põe um espaço não separável entre o símbolo e o número.
const normalize = (text: string) => text.replace(/\s/g, " ");

describe("formatMoney", () => {
  it("shows reais with the server's rate and the dollars beside", () => {
    const money = formatMoney(10, 5.1161);

    expect(normalize(money.brl)).toBe("R$ 51,16");
    expect(normalize(money.usd)).toBe("US$ 10,00");
  });

  it("keeps four decimals for a real cost under one cent", () => {
    expect(normalize(formatMoney(0.0021, 5).usd)).toBe("US$ 0,0021");
  });

  it("shows zero and invalid values as zero", () => {
    expect(normalize(formatMoney(0, 5).usd)).toBe("US$ 0,00");
    expect(normalize(formatMoney(Number.NaN, 5).brl)).toBe("R$ 0,00");
  });
});

describe("formatCount", () => {
  it("groups thousands the Brazilian way", () => {
    expect(formatCount(20113455)).toBe("20.113.455");
    expect(formatCount(Number.NaN)).toBe("0");
  });
});

describe("countOf", () => {
  it("agrees the noun with the number", () => {
    expect(countOf(1, "chamada", "chamadas")).toBe("1 chamada");
    expect(countOf(0, "chamada", "chamadas")).toBe("0 chamadas");
    expect(countOf(1200, "chamada", "chamadas")).toBe("1.200 chamadas");
  });
});
