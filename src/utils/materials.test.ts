import { describe, expect, it } from "vitest";

import { contentTypeLabel, contentTypeOf, ensureUploadFilename, formatFileSize, isAcceptedMaterial } from "./materials";

describe("isAcceptedMaterial", () => {
  it("aceita qualquer image/*", () => {
    expect(isAcceptedMaterial(new Blob([], { type: "image/png" }))).toBe(true);
  });

  it("aceita application/pdf", () => {
    expect(isAcceptedMaterial(new Blob([], { type: "application/pdf" }))).toBe(true);
  });

  it("rejeita outros tipos", () => {
    expect(isAcceptedMaterial(new Blob([], { type: "text/plain" }))).toBe(false);
  });
});

describe("contentTypeOf / contentTypeLabel", () => {
  it("classifica pdf como PDF e o resto como IMAGE", () => {
    expect(contentTypeOf(new Blob([], { type: "application/pdf" }))).toBe("PDF");
    expect(contentTypeOf(new Blob([], { type: "image/jpeg" }))).toBe("IMAGE");
  });

  it("rotula PDF e imagem em português", () => {
    expect(contentTypeLabel("PDF")).toBe("PDF");
    expect(contentTypeLabel("IMAGE")).toBe("imagem");
  });
});

describe("formatFileSize", () => {
  it("mostra bytes abaixo de 1 KB", () => {
    expect(formatFileSize(512)).toBe("512 B");
  });

  it("arredonda KB", () => {
    expect(formatFileSize(1536)).toBe("2 KB");
  });

  it("mostra MB com vírgula decimal (pt-BR)", () => {
    expect(formatFileSize(1024 * 1024 * 2.5)).toBe("2,5 MB");
  });
});

describe("ensureUploadFilename", () => {
  it("mantém o arquivo quando já tem a extensão certa", () => {
    const file = new File(["x"], "pagina.jpg", { type: "image/jpeg" });

    expect(ensureUploadFilename(file, "IMAGE")).toBe(file);
  });

  it("gera nome .pdf pra Blob sem nome quando o tipo é PDF", () => {
    const blob = new Blob(["x"], { type: "application/pdf" });
    const result = ensureUploadFilename(blob, "PDF");

    expect(result.name).toMatch(/^captura-\d+\.pdf$/);
  });

  it("gera nome .png quando o Blob é image/png", () => {
    const blob = new Blob(["x"], { type: "image/png" });

    expect(ensureUploadFilename(blob, "IMAGE").name).toMatch(/\.png$/);
  });

  it("cai em .jpg pra imagem que não é png", () => {
    const blob = new Blob(["x"], { type: "image/jpeg" });

    expect(ensureUploadFilename(blob, "IMAGE").name).toMatch(/\.jpg$/);
  });

  it("substitui um nome com extensão errada", () => {
    const file = new File(["x"], "captura.heic", { type: "image/jpeg" });

    expect(ensureUploadFilename(file, "IMAGE").name).toMatch(/\.jpg$/);
  });
});
