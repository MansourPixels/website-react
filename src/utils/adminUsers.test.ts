import { describe, expect, it } from "vitest";

import type { AdminUser, AdminUserPage } from "@/types/api/admin";

import { applyEnabled, pageCount, sortByCost, userSearchFromUrl, userSearchToUrl } from "./adminUsers";

function user(ownerId: string, username: string, costUsd30d = 0, enabled = true): AdminUser {
  return { ownerId, username, email: `${username}@x.com`, enabled, costUsd30d, calls30d: 1 };
}

function page(users: AdminUser[]): AdminUserPage {
  return { total: users.length, page: 0, size: 20, users, usdBrlRate: 5 };
}

describe("applyEnabled", () => {
  it("changes only the account asked for", () => {
    const before = page([user("a", "ana"), user("b", "bia")]);

    const after = applyEnabled(before, "b", false);

    expect(after.users.map((u) => u.enabled)).toEqual([true, false]);
    expect(before.users[1].enabled).toBe(true);
  });

  it("keeps the page when the account is not on it", () => {
    const before = page([user("a", "ana")]);

    expect(applyEnabled(before, "z", false)).toBe(before);
  });

  it("keeps an empty page", () => {
    const before = page([]);

    expect(applyEnabled(before, "a", true)).toBe(before);
  });
});

describe("sortByCost", () => {
  it("puts the most expensive first and breaks ties by name", () => {
    const sorted = sortByCost([user("1", "caio", 0.1), user("2", "bia", 2), user("3", "ana", 0.1)]);

    expect(sorted.map((u) => u.username)).toEqual(["bia", "ana", "caio"]);
  });
});

describe("user search in the URL", () => {
  it("reads the search and the page", () => {
    expect(userSearchFromUrl(new URLSearchParams("busca=%20ana%20&pagina=3"))).toEqual({ query: "ana", page: 3 });
  });

  it("falls back to the first page", () => {
    for (const pagina of ["0", "-1", "1.5", "x", ""]) {
      expect(userSearchFromUrl(new URLSearchParams(`pagina=${pagina}`)).page).toBe(1);
    }
  });

  it("leaves the defaults out of the URL", () => {
    expect(userSearchToUrl({ query: " ", page: 1 }).toString()).toBe("");
    expect(userSearchToUrl({ query: "ana", page: 2 }).toString()).toBe("busca=ana&pagina=2");
  });
});

describe("pageCount", () => {
  it("counts at least one page", () => {
    expect(pageCount(0, 20)).toBe(1);
    expect(pageCount(20, 20)).toBe(1);
    expect(pageCount(21, 20)).toBe(2);
  });
});
