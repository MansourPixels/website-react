import { describe, expect, it } from "vitest";

import {
  chunkForSpeech,
  flashcardSpeech,
  latexToSpeech,
  markdownToSpeech,
  mindMapSpeech,
  quizSpeech,
  speakableSymbols,
} from "./speechText";

describe("speakableSymbols", () => {
  it("lê expoentes em vez de engolir o caractere", () => {
    expect(speakableSymbols("x² + y³")).toBe("x ao quadrado + y ao cubo");
  });

  it("lê índices por extenso", () => {
    expect(speakableSymbols("H₂O")).toBe("H índice 2 O");
  });

  it("traduz comparadores compostos sem quebrá-los em dois", () => {
    expect(speakableSymbols("a ≤ b")).toBe("a menor ou igual a b");
    expect(speakableSymbols("a ≠ b")).toBe("a diferente de b");
  });

  it("traduz letras gregas e operadores", () => {
    expect(speakableSymbols("π × Δ")).toBe("pi vezes delta");
    expect(speakableSymbols("√4")).toBe("raiz de 4");
  });

  it("não mexe em texto comum", () => {
    expect(speakableSymbols("A capital do Brasil")).toBe(
      "A capital do Brasil",
    );
  });
});

describe("latexToSpeech", () => {
  it("lê fração como 'sobre'", () => {
    expect(latexToSpeech("\\frac{1}{2}")).toBe("1 sobre 2");
  });

  it("lê raiz e expoente", () => {
    expect(latexToSpeech("\\sqrt{x}")).toBe("raiz de x");
    expect(latexToSpeech("x^{2}")).toBe("x ao quadrado");
    expect(latexToSpeech("x^{n}")).toBe("x elevado a n");
  });

  it("não deixa barra invertida nem chave sobrar para a fala", () => {
    const result = latexToSpeech("\\mathbb{R} \\quad \\foo{z}");

    expect(result).not.toContain("\\");
    expect(result).not.toContain("{");
    expect(result).not.toContain("}");
  });
});

describe("markdownToSpeech", () => {
  it("remove marcação de título e fecha a frase com ponto", () => {
    expect(markdownToSpeech("## Função do 1º grau")).toBe(
      "Função do 1º grau.",
    );
  });

  it("remove negrito e itálico mantendo o conteúdo", () => {
    expect(markdownToSpeech("O **coeficiente** é _angular_")).toBe(
      "O coeficiente é angular",
    );
  });

  it("nunca deixa asterisco nem sustenido chegarem na fala", () => {
    const result = markdownToSpeech("# Título\n\n- **um**\n- *dois*\n");

    expect(result).not.toContain("*");
    expect(result).not.toContain("#");
  });

  it("lê o rótulo do link, não a URL", () => {
    expect(markdownToSpeech("Veja [a tabela](https://exemplo.com/x)")).toBe(
      "Veja a tabela",
    );
  });

  it("descarta bloco de código", () => {
    const result = markdownToSpeech("Antes\n\n```js\nconst x = 1;\n```\n\nDepois");

    expect(result).not.toContain("const");
    expect(result).toContain("Antes");
    expect(result).toContain("Depois");
  });

  it("converte LaTeX inline e em bloco", () => {
    expect(markdownToSpeech("A área é $$\\frac{b \\times h}{2}$$")).toContain(
      "sobre 2",
    );
    expect(markdownToSpeech("Vale \\(x^{2}\\) aqui")).toContain(
      "ao quadrado",
    );
  });

  it("transforma item de lista em frase", () => {
    expect(markdownToSpeech("- primeiro\n- segundo")).toBe(
      "primeiro. segundo.",
    );
  });

  it("lê célula de tabela separada por vírgula e ignora o separador", () => {
    const result = markdownToSpeech(
      "| Nome | Valor |\n| --- | --- |\n| pi | 3,14 |",
    );

    expect(result).toContain("Nome, Valor");
    expect(result).toContain("pi, 3,14");
    expect(result).not.toContain("---");
  });

  it("devolve string vazia para markdown vazio", () => {
    expect(markdownToSpeech("")).toBe("");
    expect(markdownToSpeech("   \n\n  ")).toBe("");
  });
});

describe("chunkForSpeech", () => {
  it("devolve lista vazia para texto vazio", () => {
    expect(chunkForSpeech("")).toEqual([]);
    expect(chunkForSpeech("   ")).toEqual([]);
  });

  it("mantém texto curto em um único trecho", () => {
    expect(chunkForSpeech("Uma frase curta.")).toEqual(["Uma frase curta."]);
  });

  it("agrupa frases até o limite e corta na fronteira de frase", () => {
    const chunks = chunkForSpeech("Um. Dois. Três.", 10);

    expect(chunks).toEqual(["Um. Dois.", "Três."]);
  });

  it("respeita o limite em cada trecho", () => {
    const texto = Array.from({ length: 40 }, (_, i) => `Frase ${i}.`).join(" ");

    for (const chunk of chunkForSpeech(texto, 50)) {
      expect(chunk.length).toBeLessThanOrEqual(50);
    }
  });

  it("quebra frase longa na vírgula", () => {
    const chunks = chunkForSpeech(
      "primeira parte bem longa, segunda parte bem longa",
      30,
    );

    expect(chunks[0]).toBe("primeira parte bem longa,");
  });

  it("não entra em laço infinito com palavra maior que o limite", () => {
    const chunks = chunkForSpeech("a".repeat(25), 10);

    expect(chunks.length).toBe(3);
    expect(chunks.join("")).toBe("a".repeat(25));
  });

  it("não perde conteúdo ao fatiar", () => {
    const texto = "Alfa. Bravo. Charlie. Delta. Echo.";
    const juntos = chunkForSpeech(texto, 12).join(" ");

    expect(juntos).toBe(texto);
  });
});

describe("flashcardSpeech", () => {
  it("fala só a pergunta quando a resposta não foi revelada", () => {
    expect(flashcardSpeech({ front: "Qual é a fórmula?" })).toBe(
      "Qual é a fórmula?",
    );
    expect(flashcardSpeech({ front: "Pergunta", back: null })).toBe("Pergunta");
  });

  it("anuncia a resposta quando ela existe", () => {
    expect(flashcardSpeech({ front: "Área", back: "b × h" })).toBe(
      "Área. Resposta: b vezes h",
    );
  });
});

describe("quizSpeech", () => {
  it("numera as alternativas para a escolha ser possível de ouvido", () => {
    const result = quizSpeech({
      question: "Quanto é 2²?",
      options: [
        { letter: "A", text: "2" },
        { letter: "B", text: "4" },
      ],
    });

    expect(result).toBe(
      "Quanto é 2 ao quadrado?. Alternativa A: 2. Alternativa B: 4",
    );
  });
});

describe("mindMapSpeech", () => {
  it("devolve vazio sem raiz", () => {
    expect(mindMapSpeech(null)).toBe("");
  });

  it("percorre a árvore em ordem de leitura", () => {
    const result = mindMapSpeech({
      label: "Funções",
      detalhe: "Relação entre grandezas",
      children: [
        { label: "1º grau", formula: "y = ax + b" },
        { label: "2º grau" },
      ],
    });

    expect(result).toBe(
      "Funções. Relação entre grandezas. 1º grau. y = ax + b. 2º grau.",
    );
  });
});
