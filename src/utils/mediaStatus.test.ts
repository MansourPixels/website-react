import { describe, expect, it } from "vitest";

import type { Content } from "@/types/api/content";

import {
  DOCUMENT_POLL_LIMIT_MS,
  MEDIA_POLL_LIMIT_MS,
  describeStatus,
  effectiveStatus,
  isProcessing,
  needsPolling,
  nextPollDelay,
  pollLimitMs,
} from "./mediaStatus";

function content(overrides: Partial<Content>): Content {
  return {
    id: "1",
    name: "material",
    contentType: "PDF",
    childFolderId: "pasta",
    hasSummary: false,
    ...overrides,
  };
}

describe("isProcessing", () => {
  it("só a fila e o processamento estão em andamento", () => {
    expect(isProcessing("PENDING")).toBe(true);
    expect(isProcessing("PROCESSING")).toBe(true);
    expect(isProcessing("COMPLETED")).toBe(false);
    expect(isProcessing("FAILED")).toBe(false);
    expect(isProcessing(undefined)).toBe(false);
  });
});

describe("effectiveStatus", () => {
  it("usa o status do backend quando ele existe", () => {
    expect(effectiveStatus({ processingStatus: "FAILED", hasSummary: false })).toBe("FAILED");
    expect(effectiveStatus({ processingStatus: "COMPLETED", hasSummary: false })).toBe("COMPLETED");
  });

  it("sem status (backend antigo), hasSummary diz se terminou", () => {
    expect(effectiveStatus({ hasSummary: true })).toBe("COMPLETED");
    expect(effectiveStatus({ hasSummary: false })).toBe("PROCESSING");
  });
});

describe("needsPolling", () => {
  it("continua para o que está em andamento", () => {
    expect(needsPolling(content({ processingStatus: "PENDING" }))).toBe(true);
    expect(needsPolling(content({ processingStatus: "PROCESSING" }))).toBe(true);
  });

  it("para no que terminou, inclusive no que falhou", () => {
    expect(needsPolling(content({ processingStatus: "COMPLETED", hasSummary: true }))).toBe(false);
    expect(needsPolling(content({ processingStatus: "FAILED", hasSummary: false }))).toBe(false);
  });

  it("mantém o comportamento antigo por hasSummary quando não há status", () => {
    expect(needsPolling(content({ hasSummary: false }))).toBe(true);
    expect(needsPolling(content({ hasSummary: true }))).toBe(false);
  });
});

describe("pollLimitMs", () => {
  it("é curto quando só há documentos em andamento", () => {
    expect(pollLimitMs([content({ processingStatus: "PROCESSING" })])).toBe(DOCUMENT_POLL_LIMIT_MS);
    expect(pollLimitMs([])).toBe(DOCUMENT_POLL_LIMIT_MS);
  });

  it("é longo quando há um áudio em andamento", () => {
    expect(
      pollLimitMs([
        content({ processingStatus: "COMPLETED", hasSummary: true }),
        content({ id: "2", contentType: "AUDIO", processingStatus: "PROCESSING" }),
      ]),
    ).toBe(MEDIA_POLL_LIMIT_MS);
  });

  it("volta ao curto quando o áudio já terminou", () => {
    expect(
      pollLimitMs([content({ contentType: "AUDIO", processingStatus: "COMPLETED", hasSummary: true })]),
    ).toBe(DOCUMENT_POLL_LIMIT_MS);
  });

  it("o limite de áudio cobre uma aula longa", () => {
    expect(MEDIA_POLL_LIMIT_MS).toBe(30 * 60_000);
  });
});

describe("nextPollDelay", () => {
  it("consulta a cada 3 s no começo e a cada 10 s depois", () => {
    expect(nextPollDelay(0)).toBe(3_000);
    expect(nextPollDelay(9)).toBe(3_000);
    expect(nextPollDelay(10)).toBe(10_000);
    expect(nextPollDelay(200)).toBe(10_000);
  });
});

describe("describeStatus", () => {
  it("rotula os quatro estados", () => {
    expect(describeStatus("PENDING", null)).toEqual({ label: "Na fila", tone: "neutral", showError: false });
    expect(describeStatus("PROCESSING", null)).toEqual({ label: "Processando", tone: "progress", showError: false });
    expect(describeStatus("COMPLETED", null)).toEqual({ label: "Pronto", tone: "success", showError: false });
  });

  it("uma falha mostra o motivo só quando o backend mandou um", () => {
    expect(describeStatus("FAILED", "O arquivo não pôde ser lido.")).toEqual({
      label: "Falhou",
      tone: "danger",
      showError: true,
    });
    expect(describeStatus("FAILED", null).showError).toBe(false);
    expect(describeStatus("FAILED", "   ").showError).toBe(false);
  });

  it("não mostra motivo em quem não falhou, mesmo que venha um", () => {
    expect(describeStatus("COMPLETED", "resto de uma falha antiga").showError).toBe(false);
  });
});
