import { describe, expect, it } from "vitest";

import { barScale, shares } from "./barScale";

describe("barScale", () => {
  it("scales to the largest value", () => {
    expect(barScale([1, 2, 4], 100)).toEqual([25, 50, 100]);
  });

  it("gives zero bars when every value is zero, and handles one value", () => {
    expect(barScale([0, 0], 100)).toEqual([0, 0]);
    expect(barScale([3], 80)).toEqual([80]);
    expect(barScale([], 80)).toEqual([]);
  });

  it("gives every bar the full size when all values are equal", () => {
    expect(barScale([5, 5, 5], 10)).toEqual([10, 10, 10]);
  });
});

describe("shares", () => {
  it("rounds so the shares add up to 100", () => {
    const result = shares([1, 1, 1]);
    expect(result.reduce((a, b) => a + b, 0)).toBe(100);
    expect(result).toEqual([34, 33, 33]);
  });

  it("is zero for an empty total", () => {
    expect(shares([0, 0])).toEqual([0, 0]);
  });
});
