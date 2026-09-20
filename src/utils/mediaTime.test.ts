import { describe, expect, it } from "vitest";

import { activeSegmentIndex, clampSeek, formatTimestamp } from "./mediaTime";

describe("formatTimestamp", () => {
  it.each([
    [0, "0:00"],
    [5.9, "0:05"],
    [65, "1:05"],
    [600, "10:00"],
    [3599, "59:59"],
    [3600, "1:00:00"],
    [3725.4, "1:02:05"],
  ])("formata %s como %s", (seconds, expected) => {
    expect(formatTimestamp(seconds)).toBe(expected);
  });

  it("trata negativo e valor inválido como zero", () => {
    expect(formatTimestamp(-4)).toBe("0:00");
    expect(formatTimestamp(Number.NaN)).toBe("0:00");
    expect(formatTimestamp(Number.POSITIVE_INFINITY)).toBe("0:00");
  });
});

describe("activeSegmentIndex", () => {
  const segments = [
    { startSeconds: 0 },
    { startSeconds: 2.8 },
    { startSeconds: 7.36 },
    { startSeconds: 10 },
  ];

  it("devolve -1 antes do primeiro segmento e com lista vazia", () => {
    expect(activeSegmentIndex([{ startSeconds: 5 }], 1)).toBe(-1);
    expect(activeSegmentIndex([], 10)).toBe(-1);
  });

  it("acha o segmento que contém o tempo", () => {
    expect(activeSegmentIndex(segments, 0)).toBe(0);
    expect(activeSegmentIndex(segments, 1)).toBe(0);
    expect(activeSegmentIndex(segments, 5)).toBe(1);
    expect(activeSegmentIndex(segments, 9.99)).toBe(2);
  });

  it("vale nas fronteiras exatas e depois do último", () => {
    expect(activeSegmentIndex(segments, 2.8)).toBe(1);
    expect(activeSegmentIndex(segments, 10)).toBe(3);
    expect(activeSegmentIndex(segments, 9999)).toBe(3);
  });

  it("funciona com uma aula de milhares de segmentos", () => {
    const many = Array.from({ length: 5000 }, (_, index) => ({
      startSeconds: index * 2.5,
    }));

    expect(activeSegmentIndex(many, 7500)).toBe(3000);
    expect(activeSegmentIndex(many, 7501)).toBe(3000);
    expect(activeSegmentIndex(many, 12497)).toBe(4998);
  });
});

describe("clampSeek", () => {
  it("mantém o salto dentro do áudio", () => {
    expect(clampSeek(30, 100)).toBe(30);
    expect(clampSeek(500, 100)).toBe(100);
    expect(clampSeek(-3, 100)).toBe(0);
  });

  it("sem duração conhecida só impede negativo e valor inválido", () => {
    expect(clampSeek(500, null)).toBe(500);
    expect(clampSeek(500, undefined)).toBe(500);
    expect(clampSeek(500, 0)).toBe(500);
    expect(clampSeek(-1, null)).toBe(0);
    expect(clampSeek(Number.NaN, 100)).toBe(0);
  });
});
