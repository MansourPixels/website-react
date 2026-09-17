import { describe, expect, it } from "vitest";

import { getContentTextStatus } from "./contentTextStatus";

describe("getContentTextStatus", () => {
  it("identifica uma extração pendente pelo timestamp", () => {
    expect(
      getContentTextStatus({
        contentId: "c1",
        text: "",
        extractedAt: null,
      }),
    ).toBe("pending");
  });

  it("distingue uma extração concluída sem texto", () => {
    expect(
      getContentTextStatus({
        contentId: "c1",
        text: "   ",
        extractedAt: "2026-09-15T12:34:56Z",
      }),
    ).toBe("empty");
  });

  it("identifica texto disponível", () => {
    expect(
      getContentTextStatus({
        contentId: "c1",
        text: "Texto do material",
        extractedAt: "2026-09-15T12:34:56Z",
      }),
    ).toBe("available");
  });
});
