import { describe, expect, it } from "vitest";

import {
  AUDIO_ACCEPT,
  MAX_AUDIO_BYTES,
  MAX_DOCUMENT_BYTES,
  audioProblem,
  classroomKindForFileName,
  classroomLimitFor,
  contentTypeLabel,
  contentTypeOf,
  ensureUploadFilename,
  formatFileSize,
  isAcceptedMaterial,
  isAudioFile,
} from "./materials";

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

describe("áudio", () => {
  const audio = (name: string, bytes = 10) => new File([new Uint8Array(bytes)], name);

  it("rotula o áudio em português", () => {
    expect(contentTypeLabel("AUDIO")).toBe("áudio");
  });

  it("monta o accept com as extensões aceitas", () => {
    expect(AUDIO_ACCEPT).toBe(".mp3,.m4a,.wav,.ogg,.flac");
  });

  it("reconhece as cinco extensões, em qualquer caixa", () => {
    for (const name of ["a.mp3", "a.m4a", "a.wav", "a.ogg", "a.flac", "AULA 3.MP3"]) {
      expect(isAudioFile(audio(name))).toBe(true);
    }
  });

  it("não reconhece o que não é áudio nem nomes sem extensão", () => {
    for (const name of ["a.pdf", "a.png", "a.mp4", "a.mp3.txt", "mp3", "a."]) {
      expect(isAudioFile(audio(name))).toBe(false);
    }
  });

  it("aceita um áudio válido, inclusive exatamente no limite", () => {
    expect(audioProblem(audio("aula.mp3"))).toBeNull();
    expect(audioProblem({ name: "aula.mp3", size: MAX_AUDIO_BYTES } as File)).toBeNull();
  });

  it("explica por que recusa: extensão, vazio e tamanho", () => {
    expect(audioProblem(audio("notas.pdf"))).toContain("áudio");
    expect(audioProblem(audio("aula.mp3", 0))).toBe("O arquivo está vazio.");
    expect(audioProblem({ name: "aula.mp3", size: MAX_AUDIO_BYTES + 1 } as File)).toContain("limite é 200,0 MB");
  });

  it("não deixa a captura gerar um nome de imagem para áudio", () => {
    const file = new File(["x"], "aula.mp3", { type: "audio/mpeg" });

    expect(ensureUploadFilename(file, "AUDIO")).toBe(file);
    expect(ensureUploadFilename(new Blob(["x"], { type: "audio/mpeg" }), "AUDIO").name).toMatch(/^audio-\d+\.mp3$/);
  });
});

describe("kind de arquivo de turma", () => {
  it("deriva o kind da extensão", () => {
    expect(classroomKindForFileName("notas.pdf")).toBe("pdf");
    expect(classroomKindForFileName("foto.JPG")).toBe("image");
    expect(classroomKindForFileName("foto.jpeg")).toBe("image");
    expect(classroomKindForFileName("foto.png")).toBe("image");
    expect(classroomKindForFileName("aula.m4a")).toBe("audio");
  });

  it("devolve null para o que a turma não aceita", () => {
    expect(classroomKindForFileName("clip.mp4")).toBeNull();
    expect(classroomKindForFileName("sem-extensao")).toBeNull();
  });

  it("dá o limite de cada kind", () => {
    expect(classroomLimitFor("audio")).toBe(MAX_AUDIO_BYTES);
    expect(classroomLimitFor("pdf")).toBe(MAX_DOCUMENT_BYTES);
    expect(classroomLimitFor("image")).toBe(MAX_DOCUMENT_BYTES);
  });
});
