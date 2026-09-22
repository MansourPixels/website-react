import { describe, expect, it } from "vitest";

import {
  canAddContent,
  canDeleteContent,
  canEditContent,
  canInviteMembers,
  canLeaveClassroom,
  canManageClassroomTasks,
  canManageFolders,
  canManageMembers,
  canRegenerateMedia,
  roleLabel,
} from "./classroomPermissions";

const EU = "usuario-atual";
const OUTRA_PESSOA = "outro-editor";

const meuConteudo = { author: { id: EU } };
const conteudoAlheio = { author: { id: OUTRA_PESSOA } };

describe("gestão da turma", () => {
  it("só o dono convida e gerencia membros; editor também mexe nas pastas", () => {
    expect(canInviteMembers("owner")).toBe(true);
    expect(canInviteMembers("editor")).toBe(false);
    expect(canInviteMembers("viewer")).toBe(false);

    expect(canManageMembers("owner")).toBe(true);
    expect(canManageMembers("editor")).toBe(false);

    expect(canManageFolders("owner")).toBe(true);
    expect(canManageFolders("editor")).toBe(true);
    expect(canManageFolders("viewer")).toBe(false);
  });

  it("todo mundo sai da turma, menos o dono", () => {
    expect(canLeaveClassroom("owner")).toBe(false);
    expect(canLeaveClassroom("editor")).toBe(true);
    expect(canLeaveClassroom("viewer")).toBe(true);
  });
});

describe("canManageClassroomTasks", () => {
  it("deixa dono e editor criar/editar/excluir a entrega da turma; o membro comum, não", () => {
    expect(canManageClassroomTasks("owner")).toBe(true);
    expect(canManageClassroomTasks("editor")).toBe(true);
    expect(canManageClassroomTasks("viewer")).toBe(false);
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

  it("permite ao membro ainda autor editar o próprio conteúdo", () => {
    expect(canEditContent("viewer", meuConteudo, EU)).toBe(true);
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

  it("permite ao membro ainda autor excluir o próprio conteúdo", () => {
    expect(canDeleteContent("viewer", meuConteudo, EU)).toBe(true);
  });
});

describe("roleLabel", () => {
  it("traduz os papéis para o rótulo em português", () => {
    expect(roleLabel("owner")).toBe("Dono");
    expect(roleLabel("editor")).toBe("Editor");
    expect(roleLabel("viewer")).toBe("Membro");
  });
});

describe("canRegenerateMedia", () => {
  it("permite a dono e editor, e nega a quem só assiste", () => {
    expect(canRegenerateMedia("owner")).toBe(true);
    expect(canRegenerateMedia("editor")).toBe(true);
    expect(canRegenerateMedia("viewer")).toBe(false);
  });
});
