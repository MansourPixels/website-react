import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));

vi.mock("./client", async () => {
  class ApiError extends Error {
    status: number;
    detail: string;

    constructor(status: number, detail: string) {
      super(detail);
      this.status = status;
      this.detail = detail;
    }
  }

  return { apiFetch, ApiError };
});

import { ApiError } from "./client";
import {
  drawRaffleWinner,
  getRaffleStatus,
  listRaffleEntries,
  probeRaffleAdmin,
  registerForRaffle,
} from "./raffle";

describe("raffle API", () => {
  beforeEach(() => apiFetch.mockReset());

  it("reads the status with an optional abort signal", async () => {
    const signal = new AbortController().signal;
    apiFetch.mockResolvedValue({ registered: false, registeredAt: null });
    await getRaffleStatus(signal);
    expect(apiFetch).toHaveBeenCalledWith("/api/raffle/me", { signal });
  });

  it("enters with consent only, never sending name or email", async () => {
    apiFetch.mockResolvedValue({ registered: true, registeredAt: "x" });
    await registerForRaffle();
    expect(apiFetch).toHaveBeenCalledWith("/api/raffle/registrations", {
      method: "POST",
      body: { consent: true },
    });
  });

  it("sends the Instagram handle along with the consent when provided", async () => {
    apiFetch.mockResolvedValue({ registered: true, registeredAt: "x" });
    await registerForRaffle("revi.app");
    expect(apiFetch).toHaveBeenCalledWith("/api/raffle/registrations", {
      method: "POST",
      body: { consent: true, instagram: "revi.app" },
    });
  });

  it("probes the admin role: success is yes, 403 is no", async () => {
    apiFetch.mockResolvedValueOnce(undefined);
    await expect(probeRaffleAdmin()).resolves.toBe(true);

    apiFetch.mockRejectedValueOnce(new ApiError(403, "denied"));
    await expect(probeRaffleAdmin()).resolves.toBe(false);
  });

  it("does not turn other failures of the probe into a plain no", async () => {
    apiFetch.mockRejectedValueOnce(new ApiError(503, "down"));
    await expect(probeRaffleAdmin()).rejects.toMatchObject({ status: 503 });

    apiFetch.mockRejectedValueOnce(new TypeError("network"));
    await expect(probeRaffleAdmin()).rejects.toBeInstanceOf(TypeError);
  });

  it("lists entries and draws with the admin routes", async () => {
    const signal = new AbortController().signal;
    apiFetch.mockResolvedValue({ total: 0, entries: [] });
    await listRaffleEntries(signal);
    expect(apiFetch).toHaveBeenCalledWith("/api/raffle/admin/entries", {
      signal,
    });

    await drawRaffleWinner();
    expect(apiFetch).toHaveBeenLastCalledWith("/api/raffle/admin/draw", {
      method: "POST",
    });
  });
});
