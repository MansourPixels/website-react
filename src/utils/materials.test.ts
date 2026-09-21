import { describe, expect, it } from "vitest";

import {
  AUDIO_ACCEPT,
  MAX_AUDIO_BYTES,
  MAX_DOCUMENT_BYTES,
  MAX_VIDEO_BYTES,
  MEDIA_ACCEPT,
  VIDEO_ACCEPT,
  classroomKindForFileName,
  classroomLimitFor,
  contentTypeLabel,
  contentTypeOf,
  ensureUploadFilename,
  formatFileSize,
  isAcceptedMaterial,
  isAudioFile,
  isMediaFile,
  isMediaType,
  isVideoFile,
  mediaLimitFor,
  mediaNoun,
  mediaProblem,
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
    expect(formatFileSize(1024 * 1024 * 200)).toBe("200 MB");
    expect(formatFileSize(1024 * 1024 * 1023)).toBe("1023 MB");
    expect(formatFileSize(1024 * 1024 * 1024)).toBe("1 GB");
    expect(formatFileSize(1024 * 1024 * 1024 * 1.5)).toBe("1,5 GB");
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
    expect(mediaProblem(audio("aula.mp3"))).toBeNull();
    expect(mediaProblem({ name: "aula.mp3", size: MAX_AUDIO_BYTES } as File)).toBeNull();
  });

  it("explica por que recusa: extensão, vazio e tamanho", () => {
    expect(mediaProblem(audio("notas.pdf"))).toContain("áudio");
    expect(mediaProblem(audio("aula.mp3", 0))).toBe("O arquivo está vazio.");
    expect(mediaProblem({ name: "aula.mp3", size: MAX_AUDIO_BYTES + 1 } as File)).toContain("limite é 200 MB");
  });

  it("não deixa a captura gerar um nome de imagem para áudio", () => {
    const file = new File(["x"], "aula.mp3", { type: "audio/mpeg" });

    expect(ensureUploadFilename(file, "AUDIO")).toBe(file);
    expect(ensureUploadFilename(new Blob(["x"], { type: "audio/mpeg" }), "AUDIO").name).toMatch(/^audio-\d+\.mp3$/);
  });
});

describe("vídeo", () => {
  const file = (name: string, bytes = 10) => new File([new Uint8Array(bytes)], name);

  it("rotula o vídeo em português", () => {
    expect(contentTypeLabel("VIDEO")).toBe("vídeo");
    expect(mediaNoun("VIDEO")).toBe("vídeo");
    expect(mediaNoun("AUDIO")).toBe("áudio");
  });

  it("monta os accept com as extensões de vídeo e as de mídia", () => {
    expect(VIDEO_ACCEPT).toBe(".mp4,.mov,.mkv,.webm");
    expect(MEDIA_ACCEPT).toBe(`${AUDIO_ACCEPT},${VIDEO_ACCEPT}`);
  });

  it("reconhece as quatro extensões, em qualquer caixa, e nada que seja de áudio", () => {
    for (const name of ["a.mp4", "a.mov", "a.mkv", "a.webm", "AULA 3.MP4"]) {
      expect(isVideoFile(file(name))).toBe(true);
      expect(isAudioFile(file(name))).toBe(false);
      expect(isMediaFile(file(name))).toBe(true);
    }
    for (const name of ["a.avi", "a.wmv", "a.mp3", "a.pdf", "a.mp4.txt", "mp4"]) {
      expect(isVideoFile(file(name))).toBe(false);
    }
  });

  it("isMediaType: áudio e vídeo sim, o resto e o desconhecido não", () => {
    expect(isMediaType("AUDIO")).toBe(true);
    expect(isMediaType("VIDEO")).toBe(true);
    expect(isMediaType("PDF")).toBe(false);
    expect(isMediaType("IMAGE")).toBe(false);
    expect(isMediaType(undefined)).toBe(false);
    expect(isMediaType(null)).toBe(false);
  });

  it("o limite do vídeo é maior que o do áudio, e cada um vale só para o seu tipo", () => {
    expect(MAX_VIDEO_BYTES).toBe(1024 * 1024 * 1024);
    expect(mediaLimitFor(file("a.mp4"))).toBe(MAX_VIDEO_BYTES);
    expect(mediaLimitFor(file("a.mp3"))).toBe(MAX_AUDIO_BYTES);
    // Um arquivo que um áudio não poderia ter é válido como vídeo.
    const between = MAX_AUDIO_BYTES + 1;
    expect(mediaProblem({ name: "aula.mp4", size: between } as File)).toBeNull();
    expect(mediaProblem({ name: "aula.mp3", size: between } as File)).toContain("limite é 200 MB");
  });

  it("recusa um vídeo acima do limite dizendo que é um vídeo, e exatamente no limite passa", () => {
    expect(mediaProblem({ name: "aula.mkv", size: MAX_VIDEO_BYTES } as File)).toBeNull();
    expect(mediaProblem({ name: "aula.mkv", size: MAX_VIDEO_BYTES + 1 } as File)).toBe(
      `O vídeo tem ${formatFileSize(MAX_VIDEO_BYTES + 1)} e o limite é ${formatFileSize(MAX_VIDEO_BYTES)}.`,
    );
    expect(mediaProblem(file("aula.mp4", 0))).toBe("O arquivo está vazio.");
  });

  it("a mensagem de extensão inválida cita áudio e vídeo", () => {
    expect(mediaProblem(file("notas.pdf"))).toMatch(/áudio.*vídeo/);
  });

  it("contentTypeOf reconhece vídeo e áudio pelo tipo ou pela extensão, sem mudar PDF e imagem", () => {
    expect(contentTypeOf(new File(["x"], "a.mp4", { type: "video/mp4" }))).toBe("VIDEO");
    expect(contentTypeOf(new File(["x"], "a.mkv", { type: "" }))).toBe("VIDEO");
    expect(contentTypeOf(new Blob(["x"], { type: "video/webm" }))).toBe("VIDEO");
    expect(contentTypeOf(new File(["x"], "a.m4a", { type: "" }))).toBe("AUDIO");
    expect(contentTypeOf(new Blob(["x"], { type: "application/pdf" }))).toBe("PDF");
    expect(contentTypeOf(new Blob(["x"], { type: "image/png" }))).toBe("IMAGE");
  });

  it("não deixa a captura gerar um nome de imagem para vídeo", () => {
    const video = new File(["x"], "aula.mp4", { type: "video/mp4" });

    expect(ensureUploadFilename(video, "VIDEO")).toBe(video);
    expect(ensureUploadFilename(new Blob(["x"], { type: "video/mp4" }), "VIDEO").name).toMatch(/^video-\d+\.mp4$/);
  });
});

describe("kind de arquivo de turma", () => {
  it("deriva o kind da extensão", () => {
    expect(classroomKindForFileName("notas.pdf")).toBe("pdf");
    expect(classroomKindForFileName("foto.JPG")).toBe("image");
    expect(classroomKindForFileName("foto.jpeg")).toBe("image");
    expect(classroomKindForFileName("foto.png")).toBe("image");
    expect(classroomKindForFileName("aula.m4a")).toBe("audio");
    expect(classroomKindForFileName("aula.MP4")).toBe("video");
    expect(classroomKindForFileName("aula.mov")).toBe("video");
    expect(classroomKindForFileName("aula.mkv")).toBe("video");
    expect(classroomKindForFileName("aula.webm")).toBe("video");
  });

  it("devolve null para o que a turma não aceita", () => {
    expect(classroomKindForFileName("clip.avi")).toBeNull();
    expect(classroomKindForFileName("sem-extensao")).toBeNull();
  });

  it("dá o limite de cada kind", () => {
    expect(classroomLimitFor("audio")).toBe(MAX_AUDIO_BYTES);
    expect(classroomLimitFor("video")).toBe(MAX_VIDEO_BYTES);
    expect(classroomLimitFor("pdf")).toBe(MAX_DOCUMENT_BYTES);
    expect(classroomLimitFor("image")).toBe(MAX_DOCUMENT_BYTES);
  });
});
