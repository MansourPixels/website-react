import { describe, expect, it } from "vitest";

import {
  canAddContent,
  canDeleteContent,
  canEditContent,
  canInviteMembers,
  canLeaveClassroom,
  canManageFolders,
  canManageMembers,
  roleLabel,
} from "./classroomPermissions";

const EU = "usuario-atual";
const OUTRA_PESSOA = "outro-editor";

function fakeAuthor(id: string) {
  return { id, username: id, displayName: id, avatarUrl: "", xp: 0 };
}

const meuConteudo = { author: fakeAuthor(EU) };
const conteudoAlheio = { author: fakeAuthor(OUTRA_PESSOA) };

describe("gestão da turma", () => {
  it("só o dono convida, gerencia membros e mexe nas pastas", () => {
    expect(canInviteMembers("owner")).toBe(true);
    expect(canInviteMembers("editor")).toBe(false);
    expect(canInviteMembers("viewer")).toBe(false);

    expect(canManageMembers("owner")).toBe(true);
    expect(canManageMembers("editor")).toBe(false);

    expect(canManageFolders("owner")).toBe(true);
    expect(canManageFolders("editor")).toBe(false);
  });

  it("todo mundo sai da turma, menos o dono", () => {
    expect(canLeaveClassroom("owner")).toBe(false);
    expect(canLeaveClassroom("editor")).toBe(true);
    expect(canLeaveClassroom("viewer")).toBe(true);
  });
});

describe("adicionar conteúdo", () => {
  it("é do dono e do editor; o membro só consome", () => {
    expect(canAddContent("owner")).toBe(true);
    expect(canAddContent("editor")).toBe(true);
    expect(canAddContent("viewer")).toBe(false);
  });
});

describe("canEditContent", () => {
  it("permite ao editor mexer só no próprio conteúdo", () => {
    expect(canEditContent("editor", meuConteudo, EU)).toBe(true);
    expect(canEditContent("editor", conteudoAlheio, EU)).toBe(false);
  });

  it("não deixa nem o dono reescrever conteúdo de outra pessoa", () => {
    expect(canEditContent("owner", meuConteudo, EU)).toBe(true);
    expect(canEditContent("owner", conteudoAlheio, EU)).toBe(false);
  });

  it("nega o membro em qualquer caso", () => {
    expect(canEditContent("viewer", meuConteudo, EU)).toBe(false);
  });
});

describe("canDeleteContent", () => {
  it("deixa o editor excluir só o próprio conteúdo", () => {
    expect(canDeleteContent("editor", meuConteudo, EU)).toBe(true);
    expect(canDeleteContent("editor", conteudoAlheio, EU)).toBe(false);
  });

  it("deixa o dono excluir qualquer conteúdo, para moderar", () => {
    expect(canDeleteContent("owner", conteudoAlheio, EU)).toBe(true);
  });

  it("nunca deixa o membro excluir, nem o que ele mesmo teria criado", () => {
    expect(canDeleteContent("viewer", meuConteudo, EU)).toBe(false);
  });
});

describe("roleLabel", () => {
  it("traduz os papéis para o rótulo em português", () => {
    expect(roleLabel("owner")).toBe("Dono");
    expect(roleLabel("editor")).toBe("Editor");
    expect(roleLabel("viewer")).toBe("Membro");
  });
});
