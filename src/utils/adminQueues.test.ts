import { describe, expect, it } from "vitest";

import type { DeadLetterQueue } from "@/types/api/admin";

import {
  idLabel,
  queueLabel,
  queuesSearchFromUrl,
  queuesSearchToUrl,
  reasonLabel,
  sortQueues,
} from "./adminQueues";

function queue(name: string, messages: number): DeadLetterQueue {
  return { name, workQueue: name.replace(/\.dlq$/, ".queue"), messages };
}

describe("queueLabel", () => {
  it("names the known queues in Portuguese", () => {
    expect(queueLabel("revi.quiz.generation.dlq")).toBe("Geração de quiz");
    expect(queueLabel("revi.content.media-processing.dlq")).toBe("Transcrição de mídia");
    expect(queueLabel("revi.tasks.calendar.dlq")).toBe("Sincronização com o Google Agenda");
  });

  it("keeps an unknown name as it came", () => {
    expect(queueLabel("revi.nova.coisa.dlq")).toBe("revi.nova.coisa.dlq");
  });
});

describe("sortQueues", () => {
  it("puts the queues with messages first, the fullest first, then by label", () => {
    const sorted = sortQueues([
      queue("revi.summary.generation.dlq", 0),
      queue("revi.quiz.generation.dlq", 2),
      queue("revi.content.categorization.dlq", 0),
      queue("revi.tasks.calendar.dlq", 5),
    ]);

    expect(sorted.map((q) => q.name)).toEqual([
      "revi.tasks.calendar.dlq",
      "revi.quiz.generation.dlq",
      "revi.content.categorization.dlq",
      "revi.summary.generation.dlq",
    ]);
  });
});

describe("labels of a dead message", () => {
  it("translates the reasons RabbitMQ records", () => {
    expect(reasonLabel("rejected")).toBe("rejeitada");
    expect(reasonLabel("expired")).toBe("expirada");
    expect(reasonLabel(null)).toBe("motivo não registrado");
    expect(reasonLabel("other")).toBe("other");
  });

  it("names the known ids and keeps the others", () => {
    expect(idLabel("contentId")).toBe("Material");
    expect(idLabel("ownerId")).toBe("Dono");
    expect(idLabel("jobId")).toBe("jobId");
  });
});

describe("queues screen in the URL", () => {
  it("defaults to the dead-letter tab", () => {
    expect(queuesSearchFromUrl(new URLSearchParams(""))).toEqual({ tab: "filas", queue: null, source: null, page: 1 });
  });

  it("reads the failures tab with its filter and page", () => {
    expect(queuesSearchFromUrl(new URLSearchParams("aba=falhas&origem=turma&pagina=2"))).toEqual({
      tab: "falhas",
      queue: null,
      source: "classroom-processing",
      page: 2,
    });
  });

  it("ignores an unknown source and a bad page", () => {
    const search = queuesSearchFromUrl(new URLSearchParams("aba=falhas&origem=x&pagina=-3"));

    expect(search.source).toBeNull();
    expect(search.page).toBe(1);
  });

  it("round-trips an open queue and a filtered page", () => {
    const open = { tab: "filas", queue: "revi.quiz.generation.dlq", source: null, page: 1 } as const;
    const failures = { tab: "falhas", queue: null, source: "categorization", page: 3 } as const;

    expect(queuesSearchFromUrl(queuesSearchToUrl(open))).toEqual(open);
    expect(queuesSearchFromUrl(queuesSearchToUrl(failures))).toEqual(failures);
    expect(queuesSearchToUrl({ tab: "filas", queue: null, source: null, page: 1 }).toString()).toBe("");
  });
});
