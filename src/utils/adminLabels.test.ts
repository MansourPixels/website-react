import { describe, expect, it } from "vitest";

import { featureLabel, outcomeLabel, triggerLabel } from "./adminLabels";

describe("admin labels", () => {
  it("translates the known keys", () => {
    expect(featureLabel("media-transcription")).toBe("Transcrição");
    expect(featureLabel("content-ocr")).toBe("Leitura de imagem (OCR)");
    expect(triggerLabel("SWEEP")).toBe("Varredura");
    expect(outcomeLabel("FAILURE")).toBe("Falha");
  });

  it("passes unknown keys through and shows a dash for none", () => {
    expect(featureLabel("new-feature")).toBe("new-feature");
    expect(triggerLabel(null)).toBe("—");
  });
});
